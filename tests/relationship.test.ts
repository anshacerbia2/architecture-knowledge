import { describe, expect, it } from "vitest";

import { asArray, asString, isPlainObject } from "../src/io.js";
import { validateRelationships } from "../src/relationship-validator.js";
import { fixtureObject, recordFromData, validSemanticModel } from "./helpers.js";

describe("relationship validation", () => {
  it("accepts a typed, conditional, evidenced relationship", async () => {
    const result = validateRelationships(await validSemanticModel());
    expect(result.diagnostics.filter((item) => item.severity === "error")).toEqual([]);
  });

  it("rejects prohibited self-relations and endpoint type violations", async () => {
    const model = await validSemanticModel();
    model.relationships = [
      relationshipRecord({
        id: "AKR-900002",
        subject: "AKC-900001",
        predicate: "improves",
        object: "AKC-900001",
      }),
    ];
    const codes = validateRelationships(model).diagnostics.map((item) => item.code);
    expect(codes).toEqual(expect.arrayContaining(["REL_SELF", "REL_ENDPOINT_CONCEPT_TYPE"]));
  });

  it("applies predicate-specific cycle policy", async () => {
    const model = await validSemanticModel();
    const fixture = await fixtureObject("boundary/cycles.yaml");
    model.relationships = [
      ...asArray(fixture.report_only).filter(isPlainObject).map(relationshipRecord),
      ...asArray(fixture.forbidden).filter(isPlainObject).map(relationshipRecord),
    ];
    const result = validateRelationships(model);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "REL_CYCLE_FORBIDDEN", severity: "error" }),
        expect.objectContaining({ code: "REL_CYCLE_REPORTED", severity: "warning" }),
      ]),
    );
  });

  it("rejects related-to when a precise predicate exists for the same pair", async () => {
    const model = await validSemanticModel();
    const fixture = await fixtureObject("regression/imprecise-pair.yaml");
    model.relationships = asArray(fixture.relationships)
      .filter(isPlainObject)
      .map(relationshipRecord);
    expect(validateRelationships(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "REL_IMPRECISE_DUPLICATE" })]),
    );
  });

  it("rejects inconsistent explicit inverse metadata", async () => {
    const model = await validSemanticModel();
    const direct = relationshipRecord({
      id: "AKR-900030",
      subject: "AKC-900001",
      predicate: "is-a",
      object: "AKC-900002",
    });
    const inverse = relationshipRecord({
      id: "AKR-900031",
      subject: "AKC-900002",
      predicate: "generalizes",
      object: "AKC-900001",
    });
    inverse.data.strength = "strong";
    model.relationships = [direct, inverse];
    expect(validateRelationships(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "REL_INVERSE_INCONSISTENT" })]),
    );
  });

  it("requires explicit edge-local or reusable-concept condition scope", async () => {
    const model = await validSemanticModel();
    model.relationships = [
      relationshipRecord({
        id: "AKR-900040",
        conditions: [{ statement: "Unscoped condition.", concept_ids: [] }],
      }),
      relationshipRecord({
        id: "AKR-900041",
        conditions: [
          {
            statement: "Reusable condition with an incorrect scope.",
            concept_ids: ["AKC-900003"],
            scope: "edge-local",
          },
        ],
      }),
    ];
    expect(validateRelationships(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "REL_CONDITION_SCOPE" })]),
    );
  });

  it("blocks proposed and claim-context-only relationships from traversal", async () => {
    const model = await validSemanticModel();
    model.relationships = [
      relationshipRecord({
        id: "AKR-900042",
        traversal: { eligible: true, rationale: null },
      }),
    ];
    const codes = validateRelationships(model).diagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining(["REL_TRAVERSAL_UNSOURCED", "REL_TRAVERSAL_CONTEXT_ONLY"]),
    );
  });

  it("blocks inferential quality impacts and causal quality-taxonomy edges", async () => {
    const model = await validSemanticModel();
    model.claims[0]!.data.status = "sourced";
    model.claims[0]!.data.claim_type = "recommendation";
    model.relationships = [
      relationshipRecord({
        id: "AKR-900043",
        status: "sourced",
        semantic_scope: "concept-global",
        traversal: { eligible: true, rationale: null },
        predicate: "improves",
      }),
      relationshipRecord({
        id: "AKR-900044",
        subject: "AKC-900002",
        object: "AKC-900002",
        predicate: "influences",
      }),
    ];
    const codes = validateRelationships(model).diagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining(["REL_QUALITY_IMPACT_EVIDENCE", "REL_QUALITY_TAXONOMY_CAUSALITY"]),
    );
  });
  it("accepts concept-global traversal only when structured proof is exact", async () => {
    const model = await validSemanticModel();
    const claim = model.claims[0]!;
    const relationship = model.relationships[0]!;
    claim.data.claim_type = "normalized-source-claim";
    claim.data.semantic_scope = "concept-global";
    claim.data.confidence = "high";
    claim.data.status = "sourced";
    relationship.data.semantic_scope = "concept-global";
    relationship.data.confidence = "high";
    relationship.data.strength = "moderate";
    relationship.data.status = "sourced";
    relationship.data.traversal = { eligible: true, rationale: null };
    expect(validateRelationships(model).diagnostics).toEqual([]);
  });

  it("rejects relationship scope, confidence, and strength above evidence", async () => {
    const model = await validSemanticModel();
    const relationship = model.relationships[0]!;
    relationship.data.semantic_scope = "concept-global";
    relationship.data.confidence = "high";
    relationship.data.strength = "strong";
    const codes = validateRelationships(model).diagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "REL_EVIDENCE_SCOPE",
        "REL_EVIDENCE_CONFIDENCE",
        "REL_EVIDENCE_STRENGTH",
      ]),
    );
  });

  it("rejects evidence whose subject, object, or predicate does not prove the edge", async () => {
    const model = await validSemanticModel();
    const claim = model.claims[0]!;
    claim.data.subject = "AKC-900004";
    claim.data.object = { record_id: "AKC-900003" };
    claim.data.predicate = "degrades";
    const codes = validateRelationships(model).diagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "REL_EVIDENCE_SUBJECT",
        "REL_EVIDENCE_OBJECT",
        "REL_EVIDENCE_PREDICATE",
      ]),
    );
  });

  it("rejects omitted claim conditions even when a note claims a narrower meaning", async () => {
    const model = await validSemanticModel();
    model.relationships[0]!.data.conditions = [
      { statement: "A different condition.", concept_ids: [], scope: "edge-local" },
    ];
    model.relationships[0]!.data.notes =
      "This prose says the original claim condition should be understood as preserved.";
    expect(validateRelationships(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "REL_EVIDENCE_CONDITION" })]),
    );
  });
  it("rejects a multi-claim edge when any supporting claim narrows it", async () => {
    const model = await validSemanticModel();
    const primary = model.claims[0]!;
    primary.data.claim_type = "normalized-source-claim";
    primary.data.semantic_scope = "concept-global";
    primary.data.status = "sourced";
    const narrowing = recordFromData(
      {
        ...primary.data,
        id: "AKL-900002",
        semantic_scope: "claim-context-only",
        notes: "This second claim narrows the same proposed edge.",
      },
      "tests/fixtures/synthetic/AKL-900002.yaml",
    );
    model.claims.push(narrowing);
    model.records.push(narrowing);
    model.relationships[0]!.data.evidence = [primary.id, narrowing.id];
    model.relationships[0]!.data.semantic_scope = "concept-global";
    expect(validateRelationships(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "REL_EVIDENCE_SCOPE" })]),
    );
  });
});

function relationshipRecord(partial: Record<string, unknown>) {
  const predicate = asString(partial.predicate) ?? "depends-on";
  const symmetric = new Set([
    "related-to",
    "conflicts-with",
    "compatible-with",
    "alternative-to",
    "contradicted-by",
  ]).has(predicate);
  return recordFromData(
    {
      id: "AKR-900099",
      record_kind: "relationship",
      subject: "AKC-900001",
      predicate,
      object: "AKC-900002",
      strength: "weak",
      direction: symmetric ? "symmetric" : "directed",
      semantic_scope: "claim-context-only",
      conditions: [{ statement: "Synthetic condition.", concept_ids: [], scope: "edge-local" }],
      evidence: ["AKL-900001"],
      confidence: "low",
      status: "proposed",
      traversal: { eligible: false, rationale: "Synthetic relationship is not traversable." },
      notes: "Test fixture only.",
      version: 1,
      ...partial,
    },
    `tests/fixtures/synthetic/${String(partial.id)}.yaml`,
  );
}
