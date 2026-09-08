import { beforeAll, describe, expect, it } from "vitest";
import { buildGraphArtifacts } from "../src/graph-projector.js";
import { buildRetrievalArtifacts } from "../src/retrieval-units.js";
import { createRagCitationAuthority } from "../src/rag-citation-authority.js";
import { validateDecisionGuides } from "../src/decision-guide-validator.js";
import { guideModel } from "./decision-guide-helpers.js";
import { recordFromData } from "./helpers.js";
import type { RepositoryModel } from "../src/model.js";

let model: RepositoryModel;
beforeAll(async () => {
  model = await guideModel();
  const source = recordFromData(
    {
      ...structuredClone(model.sources[0]!.data),
      id: "AKS-900002",
      url: "https://example.com/risk-only",
    },
    "tests/fixtures/synthetic/source-b.yaml",
  );
  const claim = recordFromData(
    {
      ...structuredClone(model.claims[0]!.data),
      id: "AKL-900002",
      sources: [source.id],
      source_locations: [{ source_id: source.id, locator: "Risk-only" }],
    },
    "tests/fixtures/synthetic/claim-b.yaml",
  );
  model.sources.push(source);
  model.claims.push(claim);
  model.records.push(source, claim);
  model.decisionGuides[0]!.data.evidence = ["AKL-900001", claim.id];
  (model.decisionGuides[0]!.data.risk_questions as Record<string, unknown>[])[0]!.claim_ids = [
    claim.id,
  ];
});

describe("M7.1-AUD-004 binding-local citations", () => {
  it("isolates risk-only evidence and denies forged unit-local citations", () => {
    expect(validateDecisionGuides(model).diagnostics).toEqual([]);
    const graph = buildGraphArtifacts(model);
    const units = buildRetrievalArtifacts(graph).units.filter((u) => u.record_id === "AKG-900001");
    const options = units.filter((u) => u.section_key === "options");
    const risk = units.find((u) => u.section_key === "risk_questions")!;
    expect(options).toHaveLength(2);
    for (const option of options) {
      expect(option.metadata.evidence_claim_ids).toEqual(["AKL-900001"]);
      expect(option.citations.map((c) => c.source_id)).toEqual(["AKS-900001"]);
    }
    expect(risk.citations.map((c) => c.source_id)).toEqual(["AKS-900002"]);
    const authority = createRagCitationAuthority(graph);
    expect(authority.resolve("AKG-900001", "AKS-900001", options[0]!.unit_id)).toBeDefined();
    expect(authority.resolve("AKG-900001", "AKS-900002", options[0]!.unit_id)).toBeUndefined();
    expect(authority.resolve("AKG-900001", "AKS-900002", risk.unit_id)).toBeDefined();
    expect(authority.resolve("AKG-900001", "AKS-900002")).toBeUndefined();
    expect(
      authority.resolve("AKG-900001", "AKS-900002", risk.unit_id.replace(":0", ":999")),
    ).toBeUndefined();
  });
  it("keeps overview and policy provenance separate from supporting citations", () => {
    const units = buildRetrievalArtifacts(buildGraphArtifacts(model)).units;
    for (const field of [
      "overview",
      "context_variables",
      "privacy",
      "authority",
      "uncertainty_policy",
    ]) {
      const unit = units.find((u) => u.record_id === "AKG-900001" && u.section_key === field)!;
      expect(unit.citations).toEqual([]);
      expect(unit.metadata.evidence_claim_ids).toEqual([]);
      expect(unit.metadata.guide_provenance_source_ids).toEqual(["AKS-900001", "AKS-900002"]);
    }
  });
  it("does not contaminate split bindings with adjacent binding evidence", () => {
    const changed = structuredClone(model);
    const options = changed.decisionGuides[0]!.data.options as Record<string, unknown>[];
    options[0]!.summary = "Synthetic lengthy assessment. ".repeat(800);
    options[1]!.claim_ids = ["AKL-900002"];
    const units = buildRetrievalArtifacts(buildGraphArtifacts(changed)).units.filter(
      (u) => u.record_id === "AKG-900001" && u.section_key === "options",
    );
    expect(units.length).toBeGreaterThan(2);
    for (const unit of units)
      expect(unit.citations.map((c) => c.source_id)).toEqual(
        unit.metadata.binding_pointer === "/options/0" ? ["AKS-900001"] : ["AKS-900002"],
      );
    expect(new Set(units.map((u) => u.unit_id)).size).toBe(units.length);
  });
  it("includes transitive evidence for the actual binding", () => {
    const changed = structuredClone(model);
    changed.claims[0]!.data.derived_from_claims = ["AKL-900002"];
    const unit = buildRetrievalArtifacts(buildGraphArtifacts(changed)).units.find(
      (u) => u.record_id === "AKG-900001" && u.section_key === "options",
    )!;
    expect(unit.metadata.evidence_claim_ids).toEqual(["AKL-900001", "AKL-900002"]);
    expect(unit.citations.map((c) => c.source_id)).toEqual(["AKS-900001", "AKS-900002"]);
  });
  it.each(["missing", "unsourced"])("fails closed on %s binding evidence", (mode) => {
    const changed = structuredClone(model);
    if (mode === "missing") changed.claims = changed.claims.slice(1);
    else changed.claims[0]!.data.status = "proposed";
    expect(() => buildRetrievalArtifacts(buildGraphArtifacts(changed))).toThrow(
      "RETRIEVAL_GUIDE_CLAIM_INVALID",
    );
  });
});
