import { beforeAll, describe, expect, it } from "vitest";
import { loadRepository, type RepositoryModel } from "../src/model.js";
import { asArray, asStringArray, isPlainObject } from "../src/io.js";
import { validateDecisionGuides, decisionConditionKey } from "../src/decision-guide-validator.js";
import { validateDecisionRecommendation } from "../src/decision-recommendation-validator.js";
import { buildGraphArtifacts } from "../src/graph-projector.js";
import { GraphQueryEngine } from "../src/graph-query.js";
import { buildRetrievalArtifacts } from "../src/retrieval-units.js";

type Obj = Record<string, unknown>;
const objects = (v: unknown) => asArray(v).filter(isPlainObject);
let model: RepositoryModel;
beforeAll(async () => {
  model = await loadRepository(process.cwd());
});

// Synthetic ephemeral sessions over real, unmodified pilot guides. No runtime or authority issuer.
// Selection and expected pointers are deliberately fixed by scenario, not copied from validator logic.
function scenario(number: number) {
  const guide = model.decisionGuides.find((g) => g.id === `AKG-00000${number}`)!.data;
  const pointers = [
    "/options/0",
    "/options/1",
    "/constraints/0",
    "/recommended_when/0",
    number === 1 ? "/avoid_when/1" : "/recommended_when/1",
  ];
  const at = (pointer: string) => {
    const [, field, index] = pointer.split("/");
    return objects(guide[field!])[Number(index)]!;
  };
  const basis = pointers.map((guide_pointer) => ({
    guide_pointer,
    claim_ids: asStringArray(at(guide_pointer).claim_ids),
  }));
  const comparison = ["AKL-000022", "AKL-000028", "AKL-000021"][number - 1]!;
  const roots = [...new Set([...basis.flatMap((b) => b.claim_ids), comparison])].sort();
  const claims = new Map(model.claims.map((c) => [c.id, c.data]));
  const closure = new Set<string>();
  const visit = (id: string) => {
    if (closure.has(id)) return;
    closure.add(id);
    asStringArray(claims.get(id)!.derived_from_claims).forEach(visit);
  };
  roots.forEach(visit);
  const conditions = new Map<string, Obj>();
  const collect = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(collect);
    else if (isPlainObject(v)) {
      if (
        typeof v.statement === "string" &&
        typeof v.scope === "string" &&
        Array.isArray(v.concept_ids)
      )
        conditions.set(decisionConditionKey(v), v);
      Object.values(v).forEach(collect);
    }
  };
  collect(guide);
  const trueKeys = new Set<string>();
  for (const v of [...pointers.map(at), ...[...closure].map((id) => claims.get(id)!)]) {
    collect(v.conditions);
    objects(v.conditions).forEach((c) => trueKeys.add(decisionConditionKey(c)));
  }
  const evaluations = [...conditions.entries()].map(([key, condition]) => ({
    condition: structuredClone(condition),
    satisfied: trueKeys.has(key) as boolean | null,
    confirmed_by_human: true,
  }));
  const authority = {
    recommendation_only: true,
    human_decision_required: true,
    automation_may_approve: false,
  };
  const options = objects(guide.options).map((o) => String(o.concept_id));
  const context = objects(guide.context_variables).map((v) => ({
    key: String(v.key),
    value: "Synthetic bounded pilot scenario; not real project evidence",
    classification: "internal",
    provenance: "human-provided",
    confirmed_by_human: true,
  }));
  const session = {
    contract_version: 3,
    guide_version: 1,
    session_id: "22222222-2222-4222-8222-222222222222",
    guide_id: guide.id,
    context,
    drivers: [] as Obj[],
    constraints: [
      {
        concept_id: "AKC-000003",
        satisfied: true as boolean | null,
        notes: "Synthetic scope confirmation",
      },
    ],
    condition_evaluations: evaluations,
    privacy: {
      persistence: "ephemeral-only",
      external_provider_authorized: false,
      external_provider_authorization: null,
      redacted_keys: [],
    },
    authority,
  };
  const statement = {
    statement:
      "Synthetic comparison and verification question, not an accepted project conclusion.",
    claim_ids: [comparison],
    option_ids: number === 1 ? [options[0]!] : options,
  };
  const output = {
    contract_version: 4,
    inapplicable_options: [],
    guide_version: 1,
    session_id: session.session_id,
    guide_id: guide.id,
    status: number === 1 ? "recommendation" : "multiple-viable-options",
    applicable_context: structuredClone(context),
    constraint_results: [
      {
        concept_id: "AKC-000003",
        hardness: "hard",
        status: "satisfied",
        rationale: "Synthetic scope",
        claim_ids: ["AKL-000081"],
      },
    ],
    viable_options: number === 1 ? [options[0]!] : options,
    rejected_options:
      number === 1
        ? [
            {
              concept_id: options[1]!,
              reason: "Synthetic absence of operating capability",
              claim_ids: ["AKL-000073"],
            },
          ]
        : [],
    tradeoffs: [statement],
    risks: [],
    verification: [structuredClone(statement)],
    evolution_triggers: [],
    uncertainty: [...closure]
      .filter((id) => claims.get(id)!.confidence === "low")
      .map((id) => ({
        statement:
          "Low-confidence repository judgment remains unresolved by this synthetic session.",
        basis: "low-confidence",
        claim_ids: [id],
      })),
    claim_ids: roots,
    source_ids: [
      ...new Set([...closure].flatMap((id) => asStringArray(claims.get(id)!.sources))),
    ].sort(),
    evidence_claims: [...closure].sort().map((id) => structuredClone(claims.get(id)!)),
    decision_basis: basis,
    authority,
  };
  return { session, output };
}

describe("M7.2 real corpus pilot integration", () => {
  it("contains exactly three proposed guides and thirteen new, traceable support claims", () => {
    expect(model.decisionGuides.map((g) => g.id).sort()).toEqual([
      "AKG-000001",
      "AKG-000002",
      "AKG-000003",
    ]);
    expect(model.claims).toHaveLength(82);
    expect(validateDecisionGuides(model).diagnostics).toEqual([]);
    for (const g of model.decisionGuides) {
      expect(g.data.status).toBe("proposed");
      expect(g.data.review).toMatchObject({ reviewed_at: null, reviewers: [] });
      expect(g.data.authority).toMatchObject({
        automation_may_approve: false,
        human_decision_required: true,
      });
      expect(g.data.assumptions).toEqual([]);
      expect(asStringArray(g.data.evidence)).not.toContain("AKL-000045");
      expect(asArray(g.data.tradeoff_matrix)).toHaveLength(4);
    }
  });
  it.each([1, 2, 3])(
    "accepts the independently selected scenario for guide %s without mutating repository inputs",
    async (n) => {
      const f = scenario(n);
      const before = JSON.stringify(model);
      expect(await validateDecisionRecommendation(model, f.session, f.output)).toEqual([]);
      expect(JSON.stringify(model)).toBe(before);
    },
  );
  it.each([1, 2, 3])("rejects missing selection support for guide %s", async (n) => {
    const f = scenario(n);
    f.output.decision_basis = f.output.decision_basis.filter(
      (b) => b.guide_pointer !== "/recommended_when/0",
    );
    expect(
      (await validateDecisionRecommendation(model, f.session, f.output)).map((d) => d.code),
    ).toContain("DR_DECISION_BASIS");
  });
  it.each([1, 2, 3])("rejects an unknown hard constraint for guide %s", async (n) => {
    const f = scenario(n);
    f.session.constraints[0]!.satisfied = null;
    expect(
      (await validateDecisionRecommendation(model, f.session, f.output)).map((d) => d.code),
    ).toContain("DR_HARD_CONSTRAINT");
  });
  it("preserves transitive uncertainty and rejects a forged parent locator", async () => {
    const f = scenario(3);
    f.output.uncertainty = [];
    expect(
      (await validateDecisionRecommendation(model, f.session, f.output)).map((d) => d.code),
    ).toContain("DR_UNCERTAINTY_LOST");
    const g = scenario(3);
    g.output.evidence_claims.find((c) => c.id === "AKL-000001")!.source_locations = [];
    expect(
      (await validateDecisionRecommendation(model, g.session, g.output)).map((d) => d.code),
    ).toContain("DR_EVIDENCE_SNAPSHOT");
  });
  it("closes the actual availability driver evidence without asserting a quality improvement", async () => {
    const f = scenario(3);
    f.session.drivers = [
      { concept_id: "AKC-000004", role: "quality-attribute", priority: "medium" },
    ];
    f.output.decision_basis.push({
      guide_pointer: "/quality_attributes/0",
      claim_ids: ["AKL-000082"],
    });
    f.output.claim_ids.push("AKL-000082");
    f.output.source_ids.push("AKS-000005");
    f.output.evidence_claims.push(
      structuredClone(model.claims.find((c) => c.id === "AKL-000082")!.data),
    );
    expect(await validateDecisionRecommendation(model, f.session, f.output)).toEqual([]);
    f.output.source_ids = f.output.source_ids.filter((id) => id !== "AKS-000005");
    expect(
      (await validateDecisionRecommendation(model, f.session, f.output)).map((d) => d.code),
    ).toContain("DR_SOURCE_INVENTORY");
  });
  it("requires a known false exclusion for every viable complementary control", async () => {
    const f = scenario(2);
    const avoid = objects(
      model.decisionGuides.find((g) => g.id === "AKG-000002")!.data.avoid_when,
    )[0]!;
    const key = decisionConditionKey(objects(avoid.conditions)[0]);
    f.session.condition_evaluations.find(
      (e) => decisionConditionKey(e.condition) === key,
    )!.satisfied = null;
    expect(
      (await validateDecisionRecommendation(model, f.session, f.output)).map((d) => d.code),
    ).toContain("DR_OPTION_DISQUALIFIED_OR_UNKNOWN");
  });
  it("cannot select complementary controls without coordination evidence", async () => {
    const f = scenario(2);
    f.session.condition_evaluations.find(
      (e) =>
        e.condition.statement ===
        "Failure classification, attempt budgets, and breaker state are coordinated.",
    )!.satisfied = null;
    expect(
      (await validateDecisionRecommendation(model, f.session, f.output)).map((d) => d.code),
    ).toContain("DR_RECOMMENDATION_NOT_APPLICABLE");
  });
  it.each([1, 2, 3])(
    "retains clarification, missing evidence, and conflict escalation for guide %s",
    async (n) => {
      for (const basis of ["unknown-context", "missing-evidence", "conflicting-evidence"]) {
        const f = scenario(n);
        f.session.context = [];
        f.session.condition_evaluations = [];
        f.session.constraints[0]!.satisfied = null;
        Object.assign(f.output, {
          status:
            basis === "unknown-context" ? "needs-human-clarification" : "insufficient-evidence",
          applicable_context: [],
          viable_options: [],
          rejected_options: [],
          decision_basis: [],
          claim_ids: [],
          source_ids: [],
          evidence_claims: [],
          tradeoffs: [],
          verification: [],
          uncertainty: [
            {
              statement: "Synthetic unresolved input; no option may be concluded.",
              basis,
              claim_ids: [],
            },
          ],
          constraint_results: [
            {
              concept_id: "AKC-000003",
              hardness: "hard",
              status: "unknown",
              rationale: "No synthetic scope confirmation",
              claim_ids: [],
            },
          ],
        });
        expect(await validateDecisionRecommendation(model, f.session, f.output)).toEqual([]);
      }
    },
  );
  it("rejects omitted matrix cells and unrelated applicability in a cloned pilot", () => {
    const cloned = structuredClone(model);
    (cloned.decisionGuides[0]!.data.tradeoff_matrix as unknown[]).pop();
    objects(cloned.decisionGuides[0]!.data.options)[0]!.claim_ids = ["AKL-000013"];
    expect(validateDecisionGuides(cloned).diagnostics.map((d) => d.code)).toEqual(
      expect.arrayContaining(["DG_MATRIX_MISSING_CELL", "DG_CLAIM_APPLICABILITY"]),
    );
  });
  it("projects first-class guides without granting relationship traversal approval", () => {
    const graph = buildGraphArtifacts(model);
    const engine = new GraphQueryEngine(graph);
    expect(graph.decisionGuides).toHaveLength(3);
    for (const g of model.decisionGuides) {
      expect(engine.get(g.id).diagnostics).toEqual([]);
      expect(
        graph.edges.filter(
          (e) => e.from === g.id && e.family === "decision-guide-considers-option",
        ),
      ).toHaveLength(2);
      expect(
        graph.edges.some(
          (e) => e.from === g.id && e.family === "decision-guide-supported-by-claim",
        ),
      ).toBe(true);
      // Guide titles are catalog labels, not implemented graph aliases.
      expect(engine.get(String(g.data.title)).diagnostics.map((d) => d.code)).toContain(
        "GRAPH_ID_UNKNOWN",
      );
    }
  });
  it("keeps retrieval evidence binding-local, including transitive selection support", () => {
    const units = buildRetrievalArtifacts(buildGraphArtifacts(model)).units;
    expect(units.filter((u) => u.unit_kind === "decision-guide-overview")).toHaveLength(3);
    const selected = units.filter(
      (u) => u.record_id === "AKG-000001" && u.metadata.binding_pointer === "/recommended_when/0",
    );
    expect(selected.length).toBeGreaterThan(0);
    for (const unit of selected) {
      expect(unit.lifecycle_status).toBe("proposed");
      expect(unit.metadata.evidence_claim_ids).toEqual(["AKL-000007", "AKL-000070"]);
      expect(unit.citations.map((c) => c.source_id).sort()).toEqual(["AKS-000006", "AKS-000007"]);
      expect(unit.citations.every((c) => c.locators.length > 0)).toBe(true);
      expect(unit.retrieval_text).not.toContain("AKL-000073");
    }
  });
});
