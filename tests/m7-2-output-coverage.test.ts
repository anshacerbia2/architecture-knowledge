import { beforeAll, describe, expect, it } from "vitest";
import { loadRepository, type RepositoryModel } from "../src/model.js";
import { validateDecisionRecommendation } from "../src/decision-recommendation-validator.js";
import { decisionConditionKey } from "../src/decision-guide-validator.js";
import { outputScenario, objects } from "./m7-2-output-helpers.js";
import { recommendationFixture } from "./decision-recommendation-helpers.js";
import { conceptRecord, recordFromData } from "./helpers.js";

let model: RepositoryModel;
beforeAll(async () => {
  model = await loadRepository(process.cwd());
});
type Fixture = ReturnType<typeof outputScenario>;
const fixture = (n: 2 | 3 = 2, selected = [0]) =>
  outputScenario(structuredClone(model), n, selected);
const codes = async (f: Fixture) =>
  (await validateDecisionRecommendation(f.model, f.session, f.output)).map((d) => d.code);
function setRule(f: Fixture, field: string, index: number, value: boolean | null) {
  for (const condition of objects(objects(f.guide[field])[index]!.conditions))
    f.session.condition_evaluations.find(
      (e) => decisionConditionKey(e.condition) === decisionConditionKey(condition),
    )!.satisfied = value;
}

describe("M7.2-AUD-001 applicability without fabricated rejection", () => {
  it("requires an option-specific selection rule, not merely a rule somewhere in the guide", async () => {
    const f = await recommendationFixture();
    const guide = f.model.decisionGuides[0]!.data;
    const extra = {
      statement: "Synthetic inactive prerequisite",
      scope: "edge-local",
      concept_ids: [],
    };
    for (const field of ["avoid_when", "disqualifiers"])
      objects(guide[field]).forEach((rule) => {
        rule.conditions = [...(rule.conditions as unknown[]), extra];
      });
    f.session.condition_evaluations.push({
      condition: extra,
      satisfied: false,
      confirmed_by_human: true,
    });
    f.output.inapplicable_options = [{ concept_id: "AKC-900001", reason: "Synthetic assessment" }];
    f.output.rejected_options = [];
    expect(
      (await validateDecisionRecommendation(f.model, f.session, f.output)).map((d) => d.code),
    ).toEqual(["DR_INAPPLICABLE_NOT_JUSTIFIED"]);
    (guide.recommended_when as unknown[]).push({
      ...structuredClone(objects(guide.avoid_when)[0]!),
    });
    f.output.decision_basis.push({
      guide_pointer: "/recommended_when/1",
      claim_ids: ["AKL-900001"],
    });
    expect(await validateDecisionRecommendation(f.model, f.session, f.output)).toEqual([]);
  });
  it("does not include a false parallel selection rule for a viable option", async () => {
    const f = await recommendationFixture();
    const guide = f.model.decisionGuides[0]!.data;
    const rule = structuredClone(objects(guide.recommended_when)[0]!);
    const extra = {
      statement: "Synthetic false parallel prerequisite",
      scope: "edge-local",
      concept_ids: [],
    };
    (rule.conditions as unknown[]).push(extra);
    (guide.recommended_when as unknown[]).push(rule);
    f.session.condition_evaluations.push({
      condition: extra,
      satisfied: false,
      confirmed_by_human: true,
    });
    expect(await validateDecisionRecommendation(f.model, f.session, f.output)).toEqual([]);
  });
  it("does not apply another option's active exclusion to an inapplicable option", async () => {
    const f = await recommendationFixture();
    const guide = f.model.decisionGuides[0]!.data;
    const third = conceptRecord("AKC-900007", "Synthetic third option", "pattern");
    f.model.concepts.push(third);
    f.model.records.push(third);
    (f.model.claims[0]!.data.applicable_concept_ids as string[]).push(third.id);
    f.output.evidence_claims = [structuredClone(f.model.claims[0]!.data)];
    (guide.options as unknown[]).push({
      ...structuredClone(objects(guide.options)[0]!),
      concept_id: third.id,
    });
    (guide.tradeoff_matrix as unknown[]).push({
      ...structuredClone(objects(guide.tradeoff_matrix)[0]!),
      option_id: third.id,
    });
    const rule = structuredClone(objects(guide.recommended_when)[0]!);
    rule.option_id = third.id;
    const extra = {
      statement: "Synthetic third option prerequisite",
      scope: "edge-local",
      concept_ids: [],
    };
    (rule.conditions as unknown[]).push(extra);
    (guide.recommended_when as unknown[]).push(rule);
    f.session.condition_evaluations.push({
      condition: extra,
      satisfied: false,
      confirmed_by_human: true,
    });
    f.output.inapplicable_options = [
      { concept_id: third.id, reason: "Synthetic known inapplicability" },
    ];
    f.output.decision_basis.push(
      ...["/options/2", "/recommended_when/1"].map((guide_pointer) => ({
        guide_pointer,
        claim_ids: ["AKL-900001"],
      })),
    );
    expect(await validateDecisionRecommendation(f.model, f.session, f.output)).toEqual([]);
  });
  it.each([2, 3] as const)(
    "covers first alone, second alone, both and neither in pilot %s",
    async (n) => {
      for (const selected of [[0], [1], [0, 1], []]) {
        const f = fixture(n, selected);
        const before = structuredClone(f);
        expect(await codes(f), `guide ${n}, selected ${selected}`).toEqual([]);
        expect(f).toEqual(before);
      }
    },
  );
  it.each<[string, (f: Fixture) => void, string]>([
    [
      "invented rejection",
      (f) => {
        f.output.rejected_options = [
          { ...f.output.inapplicable_options[0]!, claim_ids: ["AKL-000013"] },
        ];
        f.output.inapplicable_options = [];
      },
      "DR_REJECTION_NOT_JUSTIFIED",
    ],
    [
      "omitted alternative",
      (f) => {
        f.output.inapplicable_options = [];
      },
      "DR_OPTION_OMITTED",
    ],
    [
      "overlapping partition",
      (f) => {
        f.output.inapplicable_options[0]!.concept_id = f.output.viable_options[0]!;
      },
      "DR_OPTION_PARTITION",
    ],
    [
      "duplicate inactive",
      (f) => {
        f.output.inapplicable_options.push({ ...f.output.inapplicable_options[0]! });
      },
      "DR_OPTION_PARTITION",
    ],
    [
      "unknown option",
      (f) => {
        f.output.inapplicable_options[0]!.concept_id = "AKC-999999";
      },
      "DR_OPTION_PARTITION",
    ],
    [
      "active recommendation",
      (f) => setRule(f, "recommended_when", 1, true),
      "DR_INAPPLICABLE_NOT_JUSTIFIED",
    ],
    ["active exclusion", (f) => setRule(f, "avoid_when", 1, true), "DR_INAPPLICABLE_NOT_JUSTIFIED"],
    [
      "unknown selection",
      (f) => setRule(f, "recommended_when", 1, null),
      "DR_INAPPLICABLE_NOT_JUSTIFIED",
    ],
    [
      "unknown exclusion",
      (f) => setRule(f, "avoid_when", 1, null),
      "DR_INAPPLICABLE_NOT_JUSTIFIED",
    ],
    [
      "unconfirmed assessment",
      (f) => {
        f.session.condition_evaluations.forEach((e) => {
          e.confirmed_by_human = false;
        });
      },
      "DR_INAPPLICABLE_NOT_JUSTIFIED",
    ],
    [
      "omitted assessment",
      (f) => {
        f.session.condition_evaluations = [];
      },
      "DR_INAPPLICABLE_NOT_JUSTIFIED",
    ],
    [
      "omitted inactive selection basis",
      (f) => {
        f.output.decision_basis = f.output.decision_basis.filter(
          (b) => b.guide_pointer !== "/recommended_when/1",
        );
      },
      "DR_DECISION_BASIS",
    ],
    [
      "omitted inactive exclusion basis",
      (f) => {
        f.output.decision_basis = f.output.decision_basis.filter(
          (b) => b.guide_pointer !== "/avoid_when/1",
        );
      },
      "DR_DECISION_BASIS",
    ],
    [
      "lost evaluation uncertainty",
      (f) => {
        f.output.uncertainty = [];
      },
      "DR_UNCERTAINTY_LOST",
    ],
    [
      "forged evaluation snapshot",
      (f) => {
        f.output.evidence_claims.find((c) => c.id === "AKL-000076")!.statement = "Forged";
      },
      "DR_EVIDENCE_SNAPSHOT",
    ],
    [
      "lost evaluation source",
      (f) => {
        f.output.source_ids = [];
      },
      "SCHEMA_INSTANCE",
    ],
    [
      "legacy v3 output",
      (f) => {
        f.output.contract_version = 3;
      },
      "SCHEMA_INSTANCE",
    ],
  ])("rejects %s", async (_, mutate, code) => {
    const f = fixture();
    mutate(f);
    expect(await codes(f)).toContain(code);
  });
  it("cannot short-circuit an unknown conjunct behind a false one", async () => {
    const f = fixture();
    const conditions = objects(objects(f.guide.recommended_when)[1]!.conditions);
    expect(conditions.length).toBeGreaterThan(1);
    for (const [i, c] of conditions.entries())
      f.session.condition_evaluations.find(
        (e) => decisionConditionKey(e.condition) === decisionConditionKey(c),
      )!.satisfied = i === 0 ? false : null;
    expect(await codes(f)).toContain("DR_INAPPLICABLE_NOT_JUSTIFIED");
  });
});

describe("M7.2-AUD-002 option-local statements", () => {
  it.each(["constraint_results", "rejected_options"] as const)(
    "checks conditions on additional %s evidence independently of guide basis",
    async (field) => {
      const f = await recommendationFixture();
      const condition = {
        statement: "Synthetic unsupported output premise",
        scope: "edge-local",
        concept_ids: [],
      };
      const claim = recordFromData(
        { ...structuredClone(f.model.claims[0]!.data), id: "AKL-900002", conditions: [condition] },
        "tests/fixtures/synthetic/output-extra.yaml",
      );
      f.model.claims.push(claim);
      f.model.records.push(claim);
      const guide = f.model.decisionGuides[0]!.data;
      (guide.evidence as string[]).push(claim.id);
      objects(guide.risk_questions)[0]!.claim_ids = [claim.id];
      objects(guide.risk_questions)[0]!.conditions = [condition];
      f.output[field][0]!.claim_ids = [claim.id];
      f.output.claim_ids.push(claim.id);
      f.output.evidence_claims.push(structuredClone(claim.data));
      f.output.uncertainty[0]!.claim_ids.push(claim.id);
      f.session.condition_evaluations.push({
        condition,
        satisfied: false,
        confirmed_by_human: true,
      });
      expect(
        (await validateDecisionRecommendation(f.model, f.session, f.output)).map((d) => d.code),
      ).toEqual(["DR_CLAIM_CONDITION"]);
      f.session.condition_evaluations.at(-1)!.satisfied = true;
      expect(await validateDecisionRecommendation(f.model, f.session, f.output)).toEqual([]);
    },
  );
  it.each(["wrong basis", "wrong claim"])(
    "does not replace a claim's low-confidence uncertainty with %s",
    async (mode) => {
      const f = fixture();
      if (mode === "wrong basis")
        f.output.uncertainty.forEach((u) => {
          u.basis = "tie";
        });
      else
        f.output.uncertainty.forEach((u) => {
          u.claim_ids = ["AKL-000012"];
        });
      expect(await codes(f)).toContain("DR_UNCERTAINTY_LOST");
    },
  );
  it.each(["tradeoffs", "risks", "verification", "evolution_triggers"] as const)(
    "supports local and shared %s without broadening claim applicability",
    async (field) => {
      const f = fixture(2, [0, 1]);
      f.output[field].push({
        statement: "Synthetic retry budget check",
        claim_ids: ["AKL-000026"],
        option_ids: ["AKC-000012"],
      });
      expect(await codes(f)).toEqual([]);
      f.output[field].push({
        statement: "Synthetic coordination check",
        claim_ids: ["AKL-000028"],
        option_ids: ["AKC-000012", "AKC-000013"],
      });
      expect(await codes(f)).toEqual([]);
      f.output[field]
        .find((s) => s.claim_ids.includes("AKL-000026"))!
        .option_ids.push("AKC-000013");
      expect(await codes(f)).toContain("DR_CLAIM_APPLICABILITY");
    },
  );
  it.each<[string, string[], string]>([
    ["empty", [], "SCHEMA_INSTANCE"],
    ["duplicate", ["AKC-000012", "AKC-000012"], "SCHEMA_INSTANCE"],
    ["malformed", ["retry"], "SCHEMA_INSTANCE"],
    ["outside guide", ["AKC-999999"], "DR_STATEMENT_OPTION"],
    ["inactive", ["AKC-000013"], "DR_STATEMENT_OPTION"],
  ])("rejects %s targets", async (_, targets, code) => {
    const f = fixture();
    f.output.tradeoffs[0]!.option_ids = targets;
    expect(await codes(f)).toContain(code);
  });
  it.each(["tradeoffs", "verification"] as const)(
    "requires %s coverage of every viable option",
    async (field) => {
      const f = fixture(2, [0, 1]);
      f.output[field].pop();
      expect(await codes(f)).toContain("DR_STATEMENT_COVERAGE");
    },
  );
  it("does not exempt an asserted claim just because it is also inactive-rule evidence", async () => {
    const f = fixture(3, [0]);
    // Systems-only selection evidence is false. First-principles exclusion 79 also applies
    // to the first lens, but is evaluative only when that first lens is inactive.
    const g = fixture(3, [1]);
    g.output.risks.push({
      statement: "Synthetic invalid active assertion",
      claim_ids: ["AKL-000079"],
      option_ids: ["AKC-000002"],
    });
    expect(await codes(f)).toEqual([]);
    expect(await codes(g)).toContain("DR_CLAIM_CONDITION");
  });
  it("keeps shared transitive ancestors subject to assertion conditions", async () => {
    const f = fixture();
    expect(await codes(f)).toEqual([]);
    // Fixture-only derivation: active retry support now depends on false breaker avoidance.
    // The ancestor is already present as evaluation evidence, which must not exempt it.
    const claim = f.model.claims.find((c) => c.id === "AKL-000026")!.data;
    claim.derived_from_claims = ["AKL-000076"];
    f.output.evidence_claims = f.output.evidence_claims.map((c) =>
      c.id === claim.id ? structuredClone(claim) : c,
    );
    expect(await codes(f)).toContain("DR_CLAIM_CONDITION");
  });
  it("requires explicit targets and the new partition field", async () => {
    for (const field of ["option_ids", "inapplicable_options"]) {
      const f = fixture();
      if (field === "option_ids") delete (f.output.tradeoffs[0] as Record<string, unknown>)[field];
      else delete (f.output as Record<string, unknown>)[field];
      expect(await codes(f)).toContain("SCHEMA_INSTANCE");
    }
  });
});
