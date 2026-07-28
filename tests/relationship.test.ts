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
      record_kind: "relationship",
      strength: "weak",
      direction: symmetric ? "symmetric" : "directed",
      conditions: [{ statement: "Synthetic condition.", concept_ids: [] }],
      evidence: ["AKL-900001"],
      confidence: "low",
      status: "proposed",
      notes: "Test fixture only.",
      version: 1,
      ...partial,
    },
    `tests/fixtures/synthetic/${String(partial.id)}.yaml`,
  );
}
