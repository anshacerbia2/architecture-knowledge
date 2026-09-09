import { beforeAll, describe, expect, it } from "vitest";
import { recommendationFixture } from "./decision-recommendation-helpers.js";
import { conceptRecord, recordFromData } from "./helpers.js";
import { validateDecisionRecommendation } from "../src/decision-recommendation-validator.js";
import { validateDecisionGuides } from "../src/decision-guide-validator.js";

type Fixture = Awaited<ReturnType<typeof recommendationFixture>>;
let base: Fixture;
beforeAll(async () => {
  base = await recommendationFixture();
});
const codes = async (f: Fixture) =>
  (await validateDecisionRecommendation(f.model, f.session, f.output)).map((d) => d.code);

function separateSelection(f: Fixture) {
  const a = f.model.claims[0]!.data;
  a.confidence = "high";
  f.output.evidence_claims = [structuredClone(a)];
  f.output.uncertainty = [];
  const source = recordFromData(
    {
      ...structuredClone(f.model.sources[0]!.data),
      id: "AKS-900002",
      url: "https://example.com/selection",
    },
    "tests/fixtures/synthetic/selection-source.yaml",
  );
  const claim = recordFromData(
    {
      ...structuredClone(a),
      id: "AKL-900002",
      confidence: "low",
      sources: [source.id],
      source_locations: [{ source_id: source.id, locator: "Synthetic selection basis" }],
    },
    "tests/fixtures/synthetic/selection-claim.yaml",
  );
  f.model.sources.push(source);
  f.model.claims.push(claim);
  f.model.records.push(source, claim);
  const guide = f.model.decisionGuides[0]!.data;
  (guide.evidence as string[]).push(claim.id);
  (guide.recommended_when as Record<string, unknown>[])[0]!.claim_ids = [claim.id];
  return claim;
}

function restoreSelection(f: Fixture) {
  const claim = f.model.claims.find((c) => c.id === "AKL-900002")!;
  f.output.decision_basis.find((b) => b.guide_pointer === "/recommended_when/0")!.claim_ids = [
    claim.id,
  ];
  f.output.claim_ids.push(claim.id);
  f.output.source_ids.push("AKS-900002");
  f.output.evidence_claims.push(structuredClone(claim.data));
  f.output.uncertainty.push({
    statement: "Selection evidence is uncertain",
    basis: "low-confidence",
    claim_ids: [claim.id],
  });
}

describe("decision basis evidence and version binding", () => {
  it("restores a separate selection basis without citing unrelated risk-only evidence", async () => {
    const f = structuredClone(base);
    separateSelection(f);
    restoreSelection(f);
    const unrelated = recordFromData(
      { ...structuredClone(f.model.claims[0]!.data), id: "AKL-900003" },
      "tests/fixtures/synthetic/risk-only.yaml",
    );
    f.model.claims.push(unrelated);
    f.model.records.push(unrelated);
    const guide = f.model.decisionGuides[0]!.data;
    (guide.evidence as string[]).push(unrelated.id);
    (guide.risk_questions as Record<string, unknown>[])[0]!.claim_ids = [unrelated.id];
    const before = structuredClone(f);
    expect(await codes(f)).toEqual([]);
    expect(f).toEqual(before);
    expect(f.output.claim_ids).not.toContain(unrelated.id);
  });
  it.each<[string, (f: Fixture) => void, string]>([
    [
      "empty basis",
      (f) => {
        f.output.decision_basis = [];
      },
      "DR_DECISION_BASIS",
    ],
    [
      "omitted selection pointer",
      (f) => {
        f.output.decision_basis = f.output.decision_basis.filter(
          (b) => b.guide_pointer !== "/recommended_when/0",
        );
      },
      "DR_DECISION_BASIS",
    ],
    [
      "invented pointer",
      (f) => {
        f.output.decision_basis[0]!.guide_pointer = "/options/999";
      },
      "DR_DECISION_BASIS",
    ],
    [
      "wrong rule family",
      (f) => {
        f.output.decision_basis.find(
          (b) => b.guide_pointer === "/recommended_when/0",
        )!.guide_pointer = "/avoid_when/1";
      },
      "DR_DECISION_BASIS",
    ],
    [
      "wrong basis evidence",
      (f) => {
        f.output.decision_basis[0]!.claim_ids = ["AKL-999999"];
      },
      "DR_DECISION_BASIS",
    ],
    [
      "duplicate pointer with different claims",
      (f) => {
        f.output.decision_basis.push({ ...f.output.decision_basis[0]!, claim_ids: ["AKL-999999"] });
      },
      "DR_DECISION_BASIS",
    ],
    [
      "old output guide version",
      (f) => {
        f.output.guide_version = 2;
      },
      "DR_GUIDE_VERSION",
    ],
    [
      "old session guide version",
      (f) => {
        f.session.guide_version = 2;
      },
      "DR_GUIDE_VERSION",
    ],
    [
      "coordinated stale guide version",
      (f) => {
        f.session.guide_version = 2;
        f.output.guide_version = 2;
      },
      "DR_GUIDE_VERSION",
    ],
    [
      "old session contract",
      (f) => {
        f.session.contract_version = 2;
      },
      "SCHEMA_INSTANCE",
    ],
    [
      "old output contract",
      (f) => {
        f.output.contract_version = 2;
      },
      "SCHEMA_INSTANCE",
    ],
    [
      "missing selection source",
      (f) => {
        f.output.source_ids = ["AKS-900001"];
      },
      "DR_SOURCE_INVENTORY",
    ],
    [
      "missing selection snapshot",
      (f) => {
        f.output.evidence_claims = f.output.evidence_claims.slice(0, 1);
      },
      "DR_EVIDENCE_SNAPSHOT",
    ],
    [
      "missing selection uncertainty",
      (f) => {
        f.output.uncertainty = [];
      },
      "DR_UNCERTAINTY_LOST",
    ],
    [
      "missing selection locator",
      (f) => {
        delete f.model.claims[1]!.data.source_locations;
        f.output.evidence_claims[1] = structuredClone(f.model.claims[1]!.data);
      },
      "DR_SOURCE_LOCATOR_MISSING",
    ],
    [
      "blank selection locator",
      (f) => {
        f.model.claims[1]!.data.source_locations = [{ source_id: "AKS-900002", locator: "   " }];
        f.output.evidence_claims[1] = structuredClone(f.model.claims[1]!.data);
      },
      "DR_SOURCE_LOCATOR_MISSING",
    ],
    [
      "condition omitted from session",
      (f) => {
        f.session.condition_evaluations = [];
      },
      "DR_RECOMMENDATION_NOT_APPLICABLE",
    ],
    [
      "unjustified rejection",
      (f) => {
        f.model.decisionGuides[0]!.data.disqualifiers = [];
        f.model.decisionGuides[0]!.data.avoid_when = [];
      },
      "DR_REJECTION_NOT_JUSTIFIED",
    ],
  ])("rejects %s", async (_, mutate, code) => {
    const f = structuredClone(base);
    separateSelection(f);
    restoreSelection(f);
    mutate(f);
    // Avoid a schema-invalid empty avoid_when when testing absence of rejection support.
    if (code === "DR_REJECTION_NOT_JUSTIFIED") {
      const guide = f.model.decisionGuides[0]!.data;
      guide.avoid_when = [
        {
          option_id: "AKC-900004",
          rationale: "Synthetic inactive exclusion",
          conditions: [{ statement: "Inactive", scope: "edge-local", concept_ids: [] }],
          claim_ids: ["AKL-900001"],
        },
      ];
      (guide.avoid_when as Record<string, unknown>[])[0]!.conditions = [
        ...(f.model.claims[0]!.data.conditions as unknown[]),
        { statement: "Inactive", scope: "edge-local", concept_ids: [] },
      ];
      f.session.condition_evaluations.push({
        condition: { statement: "Inactive", scope: "edge-local", concept_ids: [] },
        satisfied: false,
        confirmed_by_human: true,
      });
    }
    expect(await codes(f)).toContain(code);
  });
  it("cannot hide selection evidence by deleting pointer, roots, snapshots and uncertainty together", async () => {
    const f = structuredClone(base);
    separateSelection(f);
    f.output.decision_basis = f.output.decision_basis.filter(
      (b) => b.guide_pointer !== "/recommended_when/0",
    );
    expect(await codes(f)).toEqual(
      expect.arrayContaining([
        "DR_DECISION_BASIS",
        "DR_CLAIM_INVENTORY",
        "DR_SOURCE_INVENTORY",
        "DR_EVIDENCE_SNAPSHOT",
        "DR_UNCERTAINTY_LOST",
      ]),
    );
  });
  it("includes every active parallel selection rule", async () => {
    const f = structuredClone(base);
    separateSelection(f);
    restoreSelection(f);
    const rules = f.model.decisionGuides[0]!.data.recommended_when as Record<string, unknown>[];
    rules.push({ ...structuredClone(rules[0]!), claim_ids: ["AKL-900001"] });
    expect(await codes(f)).toContain("DR_DECISION_BASIS");
    f.output.decision_basis.push({
      guide_pointer: "/recommended_when/1",
      claim_ids: ["AKL-900001"],
    });
    expect(await codes(f)).toEqual([]);
    f.output.decision_basis.reverse();
    expect(await codes(f)).toEqual([]);
  });
  it("includes distinct rejection evidence as well as selection evidence", async () => {
    const f = structuredClone(base);
    const b = separateSelection(f);
    restoreSelection(f);
    const rejection = recordFromData(
      { ...structuredClone(b.data), id: "AKL-900003" },
      "tests/fixtures/synthetic/rejection.yaml",
    );
    f.model.claims.push(rejection);
    f.model.records.push(rejection);
    const guide = f.model.decisionGuides[0]!.data;
    (guide.evidence as string[]).push(rejection.id);
    (guide.disqualifiers as Record<string, unknown>[])[0]!.claim_ids = [rejection.id];
    expect(await codes(f)).toContain("DR_CLAIM_INVENTORY");
    f.output.decision_basis.find((b) => b.guide_pointer === "/disqualifiers/0")!.claim_ids = [
      rejection.id,
    ];
    f.output.claim_ids.push(rejection.id);
    f.output.evidence_claims.push(structuredClone(rejection.data));
    f.output.uncertainty[0]!.claim_ids.push(rejection.id);
    expect(await codes(f)).toEqual([]);
  });
  it("requires confirmed conditions and snapshots through selection derivation", async () => {
    const f = structuredClone(base);
    const b = separateSelection(f);
    restoreSelection(f);
    const condition = {
      statement: "Synthetic parent prerequisite",
      scope: "edge-local",
      concept_ids: [],
    };
    const parent = recordFromData(
      { ...structuredClone(b.data), id: "AKL-900003", conditions: [condition] },
      "tests/fixtures/synthetic/parent.yaml",
    );
    f.model.claims.push(parent);
    f.model.records.push(parent);
    b.data.derived_from_claims = [parent.id];
    b.data.sources = [];
    b.data.source_locations = [];
    f.output.evidence_claims = f.model.claims.map((c) => structuredClone(c.data));
    f.output.uncertainty[0]!.claim_ids.push(parent.id);
    expect(await codes(f)).toContain("DR_CLAIM_CONDITION");
    f.session.condition_evaluations.push({ condition, satisfied: true, confirmed_by_human: true });
    expect(await codes(f)).toEqual([]);
    f.session.condition_evaluations[1]!.satisfied = false;
    expect(await codes(f)).toContain("DR_CLAIM_CONDITION");
    f.session.condition_evaluations[1]!.satisfied = null;
    expect(await codes(f)).toContain("DR_CLAIM_CONDITION");
  });
  it("checks mandatory option and assumption bindings even when they use different evidence", async () => {
    for (const field of ["options", "assumptions", "constraints"]) {
      const f = structuredClone(base);
      const b = separateSelection(f);
      restoreSelection(f);
      const guide = f.model.decisionGuides[0]!.data;
      (guide[field] as Record<string, unknown>[])[0]!.claim_ids = [b.id];
      expect(await codes(f)).toContain("DR_DECISION_BASIS");
      f.output.decision_basis.find((entry) => entry.guide_pointer === `/${field}/0`)!.claim_ids = [
        b.id,
      ];
      expect(await codes(f)).toEqual([]);
    }
  });
});

describe("session drivers and missing context", () => {
  it.each(["constraint", "quality-attribute", "assumption", "context"])(
    "accepts a declared %s driver",
    async (role) => {
      const f = structuredClone(base);
      const id =
        role === "constraint"
          ? "AKC-900005"
          : role === "quality-attribute"
            ? "AKC-900002"
            : "AKC-900006";
      if (role === "context")
        f.model.concepts.find((c) => c.id === id)!.data.type = "context-condition";
      f.session.drivers = [{ concept_id: id, role, priority: "required" }];
      if (role === "quality-attribute")
        f.output.decision_basis.push({
          guide_pointer: "/quality_attributes/0",
          claim_ids: ["AKL-900001"],
        });
      expect(await codes(f)).toEqual([]);
    },
  );
  it.each<[string, (f: Fixture) => void, string]>([
    [
      "duplicate",
      (f) => {
        f.session.drivers = [
          { concept_id: "AKC-900005", role: "constraint", priority: "high" },
          { concept_id: "AKC-900005", role: "constraint", priority: "low" },
        ];
      },
      "DR_DRIVER_DUPLICATE",
    ],
    [
      "wrong role",
      (f) => {
        f.session.drivers = [
          { concept_id: "AKC-900005", role: "quality-attribute", priority: "required" },
        ];
      },
      "DR_DRIVER_TYPE",
    ],
    [
      "required preference",
      (f) => {
        f.session.drivers = [
          { concept_id: "AKC-900005", role: "constraint", priority: "required" },
        ];
        (f.model.decisionGuides[0]!.data.constraints as Record<string, unknown>[])[0]!.hardness =
          "preference";
        f.output.constraint_results[0]!.hardness = "preference";
      },
      "DR_DRIVER_REQUIRED_HARDNESS",
    ],
    [
      "undeclared constraint",
      (f) => {
        const c = conceptRecord("AKC-900007", "Synthetic unsupported constraint", "constraint");
        f.model.concepts.push(c);
        f.model.records.push(c);
        f.session.drivers = [{ concept_id: c.id, role: "constraint", priority: "required" }];
      },
      "DR_DRIVER_OUTSIDE_GUIDE",
    ],
  ])("rejects %s driver", async (_, mutate, code) => {
    const f = structuredClone(base);
    mutate(f);
    expect(await codes(f)).toContain(code);
  });
  it.each(["needs-human-clarification", "insufficient-evidence"])(
    "accepts empty intake with %s",
    async (status) => {
      const f = structuredClone(base);
      f.session.context = [];
      f.output.applicable_context = [];
      f.session.constraints[0]!.satisfied = null;
      f.output.constraint_results[0]!.status = "unknown";
      f.output.constraint_results[0]!.claim_ids = [];
      f.output.status = status;
      f.output.viable_options = [];
      f.output.rejected_options = [];
      f.output.tradeoffs = [];
      f.output.verification = [];
      f.output.claim_ids = [];
      f.output.source_ids = [];
      f.output.evidence_claims = [];
      f.output.decision_basis = [];
      f.output.uncertainty = [
        {
          statement: "Context and constraints need clarification",
          basis: "unknown-context",
          claim_ids: [],
        },
      ];
      expect(await codes(f)).toEqual([]);
      f.output.status = "recommendation";
      expect(await codes(f)).toContain("SCHEMA_INSTANCE");
    },
  );
});

describe("focused re-audit reproductions", () => {
  it("accepts the valid control", async () => {
    expect(await codes(structuredClone(base))).toEqual([]);
  });
  it("rejects omitted selection evidence even when output inventories agree", async () => {
    const f = structuredClone(base);
    separateSelection(f);
    expect(await codes(f)).toContain("DR_CLAIM_INVENTORY");
  });
  it("preserves structured condition references, not just identical prose", () => {
    const f = structuredClone(base);
    const original = (f.model.claims[0]!.data.conditions as Record<string, unknown>[])[0]!;
    const condition = { ...original, scope: "reusable-concept", concept_ids: ["AKC-900005"] };
    f.model.claims[0]!.data.conditions = [condition];
    const walk = (value: unknown): void => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") {
        const object = value as Record<string, unknown>;
        if (object.statement === original.statement && "scope" in object)
          Object.assign(object, structuredClone(condition));
        Object.values(object).forEach(walk);
      }
    };
    walk(f.model.decisionGuides[0]!.data);
    expect(validateDecisionGuides(f.model).diagnostics).toEqual([]);
    (f.model.decisionGuides[0]!.data.recommended_when as Record<string, unknown>[])[0]!.conditions =
      [{ ...condition, concept_ids: ["AKC-900006"] }];
    expect(validateDecisionGuides(f.model).diagnostics.map((d) => d.code)).toContain(
      "DG_CLAIM_CONDITION_LOST",
    );
  });
  it("rejects an unresolved required driver", async () => {
    const f = structuredClone(base);
    (f.session.drivers as Record<string, unknown>[]).push({
      concept_id: "AKC-999999",
      role: "constraint",
      priority: "required",
    });
    expect(await codes(f)).toContain("DR_DRIVER_UNRESOLVED");
  });
  it("allows an empty-context clarification without inventing context", async () => {
    const f = structuredClone(base);
    f.session.context = [];
    f.output.applicable_context = [];
    f.output.status = "needs-human-clarification";
    f.output.viable_options = [];
    f.output.decision_basis = [
      "/options/0",
      "/constraints/0",
      "/disqualifiers/0",
      "/avoid_when/0",
    ].map((guide_pointer) => ({ guide_pointer, claim_ids: ["AKL-900001"] }));
    expect(await codes(f)).toEqual([]);
  });
});
