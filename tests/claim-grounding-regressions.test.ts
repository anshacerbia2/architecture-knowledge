import { describe, expect, it } from "vitest";

import { validateEvidence } from "../src/evidence-validator.js";
import type { RecordEntry } from "../src/model.js";
import { cloneRecord, replaceRecord, validSemanticModel } from "./helpers.js";

describe("claim grounding regression diagnostics", () => {
  it("reports a direct cycle with an explicit closed path", async () => {
    const model = await validSemanticModel();
    const claim = synthesis(model.claims[0]!, "AKL-900002", ["AKL-900002"]);
    model.claims.push(claim);
    model.records.push(claim);
    expect(validateEvidence(model).claimDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "CLAIM_DERIVATION_CYCLE",
          path: claim.path,
          pointer: "/derived_from_claims",
          message: expect.stringContaining("AKL-900002 -> AKL-900002"),
        }),
      ]),
    );
  });

  it("reports an unresolved derived claim reference precisely", async () => {
    const model = await validSemanticModel();
    const claim = synthesis(model.claims[0]!, "AKL-900002", ["AKL-999999"]);
    model.claims.push(claim);
    model.records.push(claim);
    expect(validateEvidence(model).claimDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "CLAIM_DERIVED_REFERENCE_MISSING",
          severity: "error",
          path: claim.path,
          pointer: "/derived_from_claims",
        }),
      ]),
    );
  });

  it("does not allow a rejected source to ground a claim", async () => {
    let model = await validSemanticModel();
    model = replaceRecord(model, cloneRecord(model.sources[0]!, { status: "rejected" }));
    expect(validateEvidence(model).claimDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "CLAIM_GROUNDING_SOURCE_REJECTED",
          severity: "error",
          path: model.claims[0]!.path,
        }),
        expect.objectContaining({ code: "CLAIM_EVIDENCE_UNGROUNDED" }),
      ]),
    );
  });

  it("requires every branch of mixed source and claim evidence to be grounded", async () => {
    const model = await validSemanticModel();
    const claim = synthesis(model.claims[0]!, "AKL-900002", ["AKL-999999"], [model.sources[0]!.id]);
    model.claims.push(claim);
    model.records.push(claim);
    expect(validateEvidence(model).claimDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "CLAIM_EVIDENCE_CHAIN_MIXED_INVALID",
          path: claim.path,
        }),
        expect.objectContaining({ code: "CLAIM_EVIDENCE_UNGROUNDED", path: claim.path }),
      ]),
    );
  });
});

function synthesis(
  base: RecordEntry,
  id: string,
  dependencies: string[],
  sources: string[] = [],
): RecordEntry {
  return {
    ...base,
    id,
    path: `tests/fixtures/regression/${id}.yaml`,
    data: {
      ...base.data,
      id,
      claim_type: "synthesis",
      sources,
      derived_from_claims: dependencies,
    },
  };
}
