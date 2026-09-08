import { beforeAll, describe, expect, it } from "vitest";
import { validateDecisionRecommendation } from "../src/decision-recommendation-validator.js";
import { recommendationFixture as fixture } from "./decision-recommendation-helpers.js";
import { recordFromData } from "./helpers.js";

type Fixture = Awaited<ReturnType<typeof fixture>>;
let base: Fixture;
beforeAll(async () => {
  base = await fixture();
});
const validate = async ({ model, session, output }: Fixture) =>
  (await validateDecisionRecommendation(model, session, output)).map((d) => d.code);

describe("M7.1-AUD-001/002 output boundary regressions", () => {
  it("preserves transitive claim snapshots, locators, and uncertainty", async () => {
    const f = structuredClone(base);
    const parent = recordFromData(
      { ...structuredClone(f.model.claims[0]!.data), id: "AKL-900002" },
      "tests/fixtures/synthetic/parent.yaml",
    );
    f.model.claims.push(parent);
    f.model.records.push(parent);
    f.model.claims[0]!.data.derived_from_claims = [parent.id];
    f.model.claims[0]!.data.sources = [];
    f.model.claims[0]!.data.source_locations = [];
    f.output.evidence_claims = f.model.claims.map((c) => structuredClone(c.data));
    f.output.uncertainty[0]!.claim_ids.push(parent.id);
    expect(await validate(f)).toEqual([]);
    f.output.evidence_claims.pop();
    expect(await validate(f)).toContain("DR_EVIDENCE_SNAPSHOT");
  });
  it.each(["candidate", "rejected"])("rejects %s source evidence", async (status) => {
    const f = structuredClone(base);
    f.model.sources[0]!.data.status = status;
    expect((await validate(f)).length).toBeGreaterThan(0);
  });
  it("rejects cyclic, ungrounded, and inapplicable guide evidence", async () => {
    for (const kind of ["cycle", "ungrounded", "inapplicable"]) {
      const f = structuredClone(base);
      const claim = f.model.claims[0]!.data;
      if (kind === "cycle") claim.derived_from_claims = ["AKL-900001"];
      if (kind === "ungrounded") {
        claim.sources = [];
        claim.source_locations = [];
      }
      if (kind === "inapplicable") claim.applicable_concept_ids = [];
      expect((await validate(f)).length).toBeGreaterThan(0);
    }
  });
  it("admits multiple viable options only when both have applicable rules", async () => {
    const f = structuredClone(base);
    const guide = f.model.decisionGuides[0]!.data;
    const recommend = guide.recommended_when as Record<string, unknown>[];
    recommend.push({ ...structuredClone(recommend[0]!), option_id: "AKC-900001" });
    const condition = {
      statement: "Synthetic exclusion is active.",
      scope: "edge-local",
      concept_ids: [],
    };
    for (const rule of [
      ...(guide.disqualifiers as Record<string, unknown>[]),
      ...(guide.avoid_when as Record<string, unknown>[]),
    ])
      rule.conditions = [...(rule.conditions as unknown[]), condition];
    f.session.condition_evaluations.push({ condition, satisfied: false, confirmed_by_human: true });
    f.output.viable_options.push("AKC-900001");
    f.output.rejected_options = [];
    f.output.status = "multiple-viable-options";
    f.output.decision_basis = [
      "/options/0",
      "/options/1",
      "/constraints/0",
      "/assumptions/0",
      "/recommended_when/0",
      "/recommended_when/1",
    ].map((guide_pointer) => ({ guide_pointer, claim_ids: ["AKL-900001"] }));
    expect(await validate(f)).toEqual([]);
    f.output.status = "recommendation";
    expect(await validate(f)).toContain("DR_STATUS_CARDINALITY");
    f.output.status = "multiple-viable-options";
    f.session.condition_evaluations[1]!.satisfied = null;
    expect(await validate(f)).toContain("DR_OPTION_DISQUALIFIED_OR_UNKNOWN");
  });
  it.each(["number", "integer", "boolean", "string", "duration", "data-size"])(
    "checks %s context against its declaration",
    async (type) => {
      const f = structuredClone(base);
      const variable = (
        f.model.decisionGuides[0]!.data.context_variables as Record<string, unknown>[]
      )[0]!;
      variable.value_type = type;
      variable.allowed_values = [];
      f.session.context[0]!.value = type === "boolean" ? true : type === "string" ? "bounded" : 5;
      f.output.applicable_context = structuredClone(f.session.context);
      expect(await validate(f)).toEqual([]);
      f.session.context[0]!.value = type === "string" ? 5 : "invalid";
      expect(await validate(f)).toContain("DR_CONTEXT_VALUE");
    },
  );
  it("accepts a contextual recommendation with exact evidence and no approval", async () => {
    const f = structuredClone(base);
    const before = structuredClone(f);
    expect(await validate(f)).toEqual([]);
    expect(f).toEqual(before);
  });
  it.each<[string, (f: Fixture) => void, string]>([
    [
      "viable is also rejected",
      (f) => {
        f.output.rejected_options[0]!.concept_id = "AKC-900004";
      },
      "DR_OPTION_PARTITION",
    ],
    [
      "unknown option",
      (f) => {
        f.output.viable_options = ["AKC-999999"];
      },
      "DR_OPTION_PARTITION",
    ],
    [
      "omitted alternative",
      (f) => {
        f.output.rejected_options = [];
      },
      "DR_OPTION_OMITTED",
    ],
    [
      "multiple singleton",
      (f) => {
        f.output.status = "multiple-viable-options";
      },
      "SCHEMA_INSTANCE",
    ],
    [
      "hard unknown",
      (f) => {
        f.session.constraints[0]!.satisfied = null;
        f.output.constraint_results[0]!.status = "unknown";
      },
      "SCHEMA_INSTANCE",
    ],
    [
      "hard false",
      (f) => {
        f.session.constraints[0]!.satisfied = false;
        f.output.constraint_results[0]!.status = "unsatisfied";
      },
      "SCHEMA_INSTANCE",
    ],
    [
      "hard disguised as preference",
      (f) => {
        f.output.constraint_results[0]!.hardness = "preference";
      },
      "DR_CONSTRAINT_MISMATCH",
    ],
    [
      "result disagrees with session",
      (f) => {
        f.session.constraints[0]!.satisfied = null;
      },
      "DR_CONSTRAINT_MISMATCH",
    ],
    [
      "omitted constraint",
      (f) => {
        f.output.constraint_results = [];
      },
      "DR_CONSTRAINT_INVENTORY",
    ],
    [
      "duplicate constraint",
      (f) => {
        f.session.constraints.push(structuredClone(f.session.constraints[0]!));
      },
      "DR_CONSTRAINT_INVENTORY",
    ],
    [
      "mismatched session",
      (f) => {
        f.output.session_id = "22222222-2222-4222-8222-222222222222";
      },
      "DR_SESSION_MISMATCH",
    ],
    [
      "unresolved guide",
      (f) => {
        f.output.guide_id = "AKG-999999";
      },
      "DR_GUIDE_UNRESOLVED",
    ],
    [
      "context changed",
      (f) => {
        f.output.applicable_context[0]!.value = "two";
      },
      "DR_CONTEXT_MISMATCH",
    ],
    [
      "invented enum",
      (f) => {
        f.session.context[0]!.value = "three";
        f.output.applicable_context = structuredClone(f.session.context);
      },
      "DR_CONTEXT_VALUE",
    ],
    [
      "unconfirmed context",
      (f) => {
        f.session.context[0]!.confirmed_by_human = false;
      },
      "DR_CONTEXT_VALUE",
    ],
    [
      "undeclared context",
      (f) => {
        f.session.context[0]!.key = "secret";
      },
      "DR_CONTEXT_DECLARATION",
    ],
    [
      "duplicate context",
      (f) => {
        f.session.context.push(structuredClone(f.session.context[0]!));
      },
      "DR_CONTEXT_DUPLICATE",
    ],
    [
      "missing required context",
      (f) => {
        f.session.context = [];
      },
      "DR_CONTEXT_REQUIRED",
    ],
    [
      "unknown condition",
      (f) => {
        f.session.condition_evaluations[0]!.satisfied = null;
      },
      "DR_RECOMMENDATION_NOT_APPLICABLE",
    ],
    [
      "unconfirmed condition",
      (f) => {
        f.session.condition_evaluations[0]!.confirmed_by_human = false;
      },
      "DR_CLAIM_CONDITION",
    ],
    [
      "invented condition",
      (f) => {
        f.session.condition_evaluations[0]!.condition.statement = "Invented";
      },
      "DR_CONDITION_INVENTORY",
    ],
    [
      "duplicate condition",
      (f) => {
        f.session.condition_evaluations.push(structuredClone(f.session.condition_evaluations[0]!));
      },
      "DR_CONDITION_INVENTORY",
    ],
    [
      "contradictory guide recommendation",
      (f) => {
        (f.model.decisionGuides[0]!.data.disqualifiers as Record<string, unknown>[])[0]!.option_id =
          "AKC-900004";
      },
      "DR_OPTION_DISQUALIFIED_OR_UNKNOWN",
    ],
    [
      "audited dangling evidence",
      (f) => {
        f.output.tradeoffs[0]!.claim_ids = ["AKL-999999"];
      },
      "DR_CLAIM_INVENTORY",
    ],
    [
      "coordinated dangling inventory",
      (f) => {
        f.output.tradeoffs[0]!.claim_ids = ["AKL-999999"];
        f.output.claim_ids.push("AKL-999999");
      },
      "DR_CLAIM_UNRESOLVED",
    ],
    [
      "wrong source inventory",
      (f) => {
        f.output.source_ids = ["AKS-999999"];
      },
      "DR_SOURCE_INVENTORY",
    ],
    [
      "missing locator",
      (f) => {
        delete f.model.claims[0]!.data.source_locations;
      },
      "DR_SOURCE_LOCATOR_MISSING",
    ],
    [
      "missing snapshot",
      (f) => {
        f.output.evidence_claims = [];
      },
      "DR_EVIDENCE_SNAPSHOT",
    ],
    [
      "epistemic upgrade",
      (f) => {
        f.output.evidence_claims[0]!.claim_type = "direct-source-claim";
      },
      "DR_EVIDENCE_SNAPSHOT",
    ],
    [
      "lost qualifier",
      (f) => {
        (f.output.evidence_claims[0]!.conditions as Record<string, unknown>[])[0]!.statement =
          "Unconditionally applicable";
      },
      "DR_EVIDENCE_SNAPSHOT",
    ],
    [
      "lost uncertainty",
      (f) => {
        f.output.uncertainty = [];
      },
      "DR_UNCERTAINTY_LOST",
    ],
    [
      "unbound uncertainty",
      (f) => {
        f.output.uncertainty[0]!.claim_ids = ["AKL-999999"];
      },
      "DR_UNCERTAINTY_REFERENCE",
    ],
    [
      "duplicate model",
      (f) => {
        f.model.claims.push(structuredClone(f.model.claims[0]!));
      },
      "DR_MODEL_DUPLICATE",
    ],
    [
      "automation approval",
      (f) => {
        f.output.authority.automation_may_approve = true;
      },
      "SCHEMA_INSTANCE",
    ],
  ])("rejects %s", async (_, mutate, code) => {
    const f = structuredClone(base);
    mutate(f);
    expect(await validate(f)).toContain(code);
  });
  it("retains unknown hard constraints in a non-affirmative result", async () => {
    const f = structuredClone(base);
    f.session.constraints[0]!.satisfied = null;
    f.output.constraint_results[0]!.status = "unknown";
    f.output.status = "needs-human-clarification";
    f.output.viable_options = [];
    f.output.decision_basis = ["/options/0", "/disqualifiers/0", "/avoid_when/0"].map(
      (guide_pointer) => ({ guide_pointer, claim_ids: ["AKL-900001"] }),
    );
    expect(await validate(f)).toEqual([]);
  });
  it("does not elevate a preference to a hard constraint", async () => {
    const f = structuredClone(base);
    (f.model.decisionGuides[0]!.data.constraints as Record<string, unknown>[])[0]!.hardness =
      "preference";
    f.session.constraints[0]!.satisfied = false;
    f.output.constraint_results[0]!.hardness = "preference";
    f.output.constraint_results[0]!.status = "unsatisfied";
    expect(await validate(f)).toEqual([]);
  });
});
