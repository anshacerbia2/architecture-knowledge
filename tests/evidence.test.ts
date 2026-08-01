import { describe, expect, it } from "vitest";

import { validateEvidence } from "../src/evidence-validator.js";
import { cloneRecord, replaceRecord, validSemanticModel } from "./helpers.js";

async function normativeEvidenceModel() {
  const model = await validSemanticModel();
  const claim = model.claims[0]!;
  claim.data.claim_type = "normalized-source-claim";
  claim.data.status = "sourced";
  claim.data.statement = "Synthetic clients MUST validate the synthetic control.";
  claim.data.sources = [model.sources[0]!.id];
  claim.data.derived_from_claims = [];
  claim.data.source_locations = [
    { source_id: model.sources[0]!.id, locator: "Synthetic specification Section 1" },
  ];
  claim.data.normative = {
    force: "must",
    applies_to: "Synthetic clients.",
    exceptions: [],
  };
  return model;
}

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

  it("accepts a normative claim with direct admitted in-scope evidence and a locator", async () => {
    expect(validateEvidence(await normativeEvidenceModel()).claimDiagnostics).toEqual([]);
  });

  it("rejects a sourced normative claim with no direct source", async () => {
    const model = await normativeEvidenceModel();
    model.claims[0]!.data.sources = [];
    model.claims[0]!.data.source_locations = [];
    const codes = validateEvidence(model).claimDiagnostics.map((item) => item.code);
    expect(codes).toContain("CLAIM_NORMATIVE_DIRECT_SOURCE");
  });

  it("rejects a sourced normative claim supported only by derivation", async () => {
    const model = await normativeEvidenceModel();
    model.claims[0]!.data.sources = [];
    model.claims[0]!.data.source_locations = [];
    model.claims[0]!.data.derived_from_claims = ["AKL-900002"];
    const codes = validateEvidence(model).claimDiagnostics.map((item) => item.code);
    expect(codes).toContain("CLAIM_NORMATIVE_DIRECT_SOURCE");
  });

  it("rejects a normative direct source without a locator", async () => {
    const model = await normativeEvidenceModel();
    model.claims[0]!.data.source_locations = [];
    const codes = validateEvidence(model).claimDiagnostics.map((item) => item.code);
    expect(codes).toContain("CLAIM_NORMATIVE_SOURCE_LOCATION");
  });

  it("rejects a non-admitted normative source", async () => {
    const model = await normativeEvidenceModel();
    model.sources[0]!.data.status = "candidate";
    const codes = validateEvidence(model).claimDiagnostics.map((item) => item.code);
    expect(codes).toContain("CLAIM_NORMATIVE_SOURCE_NOT_ADMITTED");
  });

  it("rejects normative evidence outside the subject domain boundary", async () => {
    const model = await normativeEvidenceModel();
    model.sources[0]!.data.domains = ["security-privacy"];
    const codes = validateEvidence(model).claimDiagnostics.map((item) => item.code);
    expect(codes).toContain("CLAIM_NORMATIVE_SOURCE_SCOPE");
  });
});
