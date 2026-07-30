import { describe, expect, it } from "vitest";

import { validateEvidence } from "../src/evidence-validator.js";
import { cloneRecord, replaceRecord, validSemanticModel } from "./helpers.js";

describe("claim and source validation", () => {
  it("accepts admitted assessed sources and explicitly typed claims", async () => {
    const result = validateEvidence(await validSemanticModel());
    expect([...result.sourceDiagnostics, ...result.claimDiagnostics]).toEqual([]);
  });

  it("rejects candidate or rejected evidence and disguised direct derivation", async () => {
    let model = await validSemanticModel();
    model = replaceRecord(model, cloneRecord(model.sources[0]!, { status: "rejected" }));
    model = replaceRecord(
      model,
      cloneRecord(model.claims[0]!, {
        claim_type: "direct-source-claim",
        derived_from_claims: ["AKL-900001"],
      }),
    );
    const codes = validateEvidence(model).claimDiagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining(["CLAIM_SOURCE_NOT_ADMITTED", "CLAIM_DIRECT_DERIVATION"]),
    );
  });

  it("warns when deprecated evidence remains in use", async () => {
    let model = await validSemanticModel();
    model = replaceRecord(model, cloneRecord(model.sources[0]!, { status: "deprecated" }));
    expect(validateEvidence(model).claimDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CLAIM_SOURCE_STALE", severity: "warning" }),
      ]),
    );
  });
  it("rejects source locators that are unresolved, undeclared, or duplicated", async () => {
    let model = await validSemanticModel();
    model = replaceRecord(
      model,
      cloneRecord(model.claims[0]!, {
        source_locations: [
          { source_id: "AKS-999999", locator: "Section 1" },
          { source_id: "AKS-999999", locator: "Section 1" },
        ],
      }),
    );
    const codes = validateEvidence(model).claimDiagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining(["CLAIM_SOURCE_LOCATION_SOURCE", "CLAIM_SOURCE_LOCATION_DUPLICATE"]),
    );
  });
});
