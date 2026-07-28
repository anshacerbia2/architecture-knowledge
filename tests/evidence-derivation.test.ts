import { describe, expect, it } from "vitest";

import { validateEvidence } from "../src/evidence-validator.js";
import type { RecordEntry } from "../src/model.js";
import { cloneRecord, replaceRecord, validSemanticModel } from "./helpers.js";

describe("claim derivation grounding", () => {
  it("rejects cyclic claims with no admitted source foundation", async () => {
    const model = await validSemanticModel();
    const first = derivedClaim(model.claims[0]!, "AKL-900002", ["AKL-900003"]);
    const second = derivedClaim(model.claims[0]!, "AKL-900003", ["AKL-900002"]);
    model.claims.push(first, second);
    model.records.push(first, second);

    const diagnostics = validateEvidence(model).claimDiagnostics;
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CLAIM_DERIVATION_CYCLE" }),
        expect.objectContaining({
          code: "CLAIM_EVIDENCE_UNGROUNDED",
          path: first.path,
        }),
        expect.objectContaining({
          code: "CLAIM_EVIDENCE_UNGROUNDED",
          path: second.path,
        }),
      ]),
    );
  });

  it("accepts a derivation chain grounded in an admitted source", async () => {
    const model = await validSemanticModel();
    const derived = derivedClaim(model.claims[0]!, "AKL-900002", [model.claims[0]!.id]);
    model.claims.push(derived);
    model.records.push(derived);

    expect(validateEvidence(model).claimDiagnostics).toEqual([]);
  });

  it("does not treat an unsupported hypothesis as grounding for a synthesis", async () => {
    let model = await validSemanticModel();
    const hypothesis = cloneRecord(model.claims[0]!, {
      claim_type: "hypothesis",
      conditions: [{ statement: "Synthetic hypothesis condition.", concept_ids: [] }],
      sources: [],
      derived_from_claims: [],
    });
    model = replaceRecord(model, hypothesis);
    const synthesis = derivedClaim(model.claims[0]!, "AKL-900002", [hypothesis.id]);
    model.claims.push(synthesis);
    model.records.push(synthesis);

    expect(validateEvidence(model).claimDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "CLAIM_EVIDENCE_UNGROUNDED",
          path: synthesis.path,
        }),
      ]),
    );
  });
});

function derivedClaim(base: RecordEntry, id: string, dependencies: string[]): RecordEntry {
  return {
    ...base,
    id,
    path: `tests/fixtures/regression/${id}.yaml`,
    data: {
      ...base.data,
      id,
      claim_type: "synthesis",
      sources: [],
      derived_from_claims: dependencies,
    },
  };
}
