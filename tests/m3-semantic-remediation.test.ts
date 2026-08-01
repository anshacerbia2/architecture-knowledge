import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import { asArray, asString, isPlainObject } from "../src/io.js";
import { loadRepository, type RecordEntry, type RepositoryModel } from "../src/model.js";

describe("M3 semantic remediation production contract", () => {
  let model: RepositoryModel;
  let byId: Map<string, RecordEntry>;

  beforeAll(async () => {
    model = await loadRepository(process.cwd());
    byId = new Map(model.records.map((record) => [record.id, record]));
  });

  it("keeps QAS source scope narrower than the repository six-field convention", () => {
    const claim = required("AKL-000006");
    expect(asString(claim.data.statement)).not.toMatch(/stimulus source|six[- ]part/iu);
    expect(asString(claim.data.notes)).toMatch(/six-part.*not attributed|six-field|fixed six/iu);
  });

  it("separates Idempotency semantics from mechanisms and broad traversal", () => {
    expect(required("AKC-000011").data.type).toBe("semantic-property");
    expect(required("AKL-000011").data.sources).toEqual(["AKS-000011"]);
    expect(asString(required("AKL-000011").data.statement)).toMatch(/HTTP method/iu);
    expect(traversalEligible("AKR-000005")).toBe(false);
  });

  it("models Availability and Reliability as qualified overlap rather than causality", () => {
    const relationship = required("AKR-000020");
    expect(relationship.data.predicate).toBe("overlaps-with");
    expect(relationship.data.direction).toBe("symmetric");
    expect(asString(relationship.data.notes)).toMatch(/neither.*hierarchy|no.*causal/iu);
  });

  it("removes the unsupported Observability-to-Reliability causal improvement", () => {
    const relationship = required("AKR-000015");
    expect(relationship.data.predicate).toBe("supports-investigation-of");
    expect(traversalEligible("AKR-000015")).toBe(false);
    expect(asString(required("AKL-000035").data.statement)).toMatch(
      /does not establish.*causes reliability improvement/iu,
    );
  });

  it("classifies Eventual Consistency as a consistency model", () => {
    expect(required("AKC-000016").data.type).toBe("consistency-model");
  });

  it("allows standalone failure modes without fabricated peer references", () => {
    const policy = isPlainObject(model.ontology.validationPolicies.markdown)
      ? model.ontology.validationPolicies.markdown
      : {};
    expect(asArray(policy.failure_sensitive_types)).not.toContain("failure-mode");
    for (const id of ["AKC-000021", "AKC-000022", "AKC-000023", "AKC-000024"]) {
      expect(asArray(required(id).data.failure_modes)).toEqual([]);
    }
  });

  it("applies the admitted OAuth/OIDC security and version boundaries", () => {
    const oauth = required("AKC-000017");
    const oidc = required("AKC-000018");
    expect(oauth.data.title).toBe("OAuth 2.0 Authorization Framework");
    expect(oauth.path).toBe("knowledge/security/oauth-2-0-authorization-framework.md");
    expect(oauth.data.sources).toEqual(["AKS-000017", "AKS-000018"]);
    expect(oidc.data.sources).toEqual(["AKS-000017", "AKS-000018", "AKS-000019"]);
    expect(oauth.data.claims).toEqual(
      expect.arrayContaining([
        "AKL-000049",
        "AKL-000050",
        "AKL-000052",
        "AKL-000053",
        "AKL-000054",
        "AKL-000055",
        "AKL-000056",
        "AKL-000058",
        "AKL-000059",
      ]),
    );
    expect(required("AKL-000050").data.normative).toMatchObject({ force: "must" });
    expect(required("AKL-000052").data.normative).toMatchObject({
      exceptions: [expect.stringContaining("loopback")],
    });
    expect(required("AKL-000054").data.normative).toMatchObject({ force: "should-not" });
    expect(required("AKL-000056").data.normative).toMatchObject({ force: "should" });
    expect(required("AKL-000059").data.normative).toBeUndefined();
    expect(asString(required("AKL-000054").data.statement)).toMatch(/^OAuth clients SHOULD NOT/u);
    expect(asString(required("AKL-000056").data.statement)).toMatch(
      /^Authorization servers and resource servers SHOULD/u,
    );
  });

  it("preserves each OIDC ID Token validation force and applicability independently", () => {
    const expected = new Map([
      ["AKL-000061", { force: "must", marker: /issuer/iu }],
      ["AKL-000064", { force: "must", marker: /audience/iu }],
      ["AKL-000065", { force: "should", marker: /azp/iu }],
      ["AKL-000066", { force: "must", marker: /not received.*Token Endpoint/iu }],
      ["AKL-000067", { force: "may", marker: /direct communication.*Token Endpoint/iu }],
      ["AKL-000068", { force: "must", marker: /exp claim/iu }],
      ["AKL-000069", { force: "must", marker: /nonce was sent/iu }],
    ]);
    for (const [id, contract] of expected) {
      const claim = required(id);
      expect(claim.data.normative, id).toMatchObject({ force: contract.force });
      expect(asString(claim.data.statement), id).toMatch(contract.marker);
      expect(claim.data.sources, id).toEqual(["AKS-000019"]);
      expect(claim.data.source_locations, id).toEqual([
        expect.objectContaining({ source_id: "AKS-000019", locator: expect.any(String) }),
      ]);
    }
    expect(required("AKL-000065").data.conditions).not.toEqual([]);
    expect(required("AKL-000066").data.conditions).not.toEqual([]);
    expect(required("AKL-000067").data.conditions).not.toEqual([]);
    expect(required("AKL-000069").data.conditions).not.toEqual([]);
    expect(asString(required("AKL-000061").data.notes)).toMatch(/semantic migration/iu);
  });

  it("keeps the ID Token API boundary as repository guidance rather than protocol force", () => {
    const claim = required("AKL-000062");
    expect(claim.data).toMatchObject({
      claim_type: "recommendation",
      semantic_scope: "claim-context-only",
      derived_from_claims: ["AKL-000059", "AKL-000060"],
    });
    expect(claim.data.normative).toBeUndefined();
    expect(asString(claim.data.statement)).not.toMatch(/\bMUST NOT\b/u);

    const oidc = required("AKC-000018");
    const recommendation = asArray(oidc.data.security_implications)
      .filter(isPlainObject)
      .find((item) => asArray(item.claim_ids).includes("AKL-000062"));
    expect(recommendation).toMatchObject({ kind: "operational-recommendation" });
  });

  it("uses explicit applicability for every OAuth control reused by OIDC", () => {
    for (const id of ["AKL-000050", "AKL-000051", "AKL-000052", "AKL-000054", "AKL-000059"]) {
      expect(asArray(required(id).data.applicable_concept_ids), id).toContain("AKC-000018");
    }
    const oidc = required("AKC-000018");
    const boundIds = new Set(
      asArray(oidc.data.security_implications)
        .filter(isPlainObject)
        .flatMap((item) => asArray(item.claim_ids)),
    );
    for (const id of [
      "AKL-000050",
      "AKL-000051",
      "AKL-000052",
      "AKL-000054",
      "AKL-000061",
      "AKL-000064",
      "AKL-000065",
      "AKL-000066",
      "AKL-000067",
      "AKL-000068",
      "AKL-000069",
    ]) {
      expect(boundIds, id).toContain(id);
    }
  });

  it("allocates and advances new OIDC claims without crossing a human-only lifecycle", () => {
    const ids = Array.from(
      { length: 6 },
      (_, index) => `AKL-${String(index + 64).padStart(6, "0")}`,
    );
    const allocations = asArray(model.idLedger.allocations).filter(isPlainObject);
    const events = asArray(model.lifecycleEvents.events).filter(isPlainObject);
    for (const id of ids) {
      expect(allocations.find((item) => item.id === id)).toMatchObject({
        record_kind: "claim",
        state: "active",
        path: `claims/${id}.yaml`,
      });
      const claimEvents = events.filter((item) => item.record_id === id);
      expect(claimEvents).toHaveLength(2);
      expect(claimEvents.map((item) => [item.from, item.to])).toEqual([
        ["proposed", "source-candidate"],
        ["source-candidate", "sourced"],
      ]);
      expect(claimEvents.every((item) => item.actor_type === "automation")).toBe(true);
      expect(claimEvents.every((item) => item.human_authorized === false)).toBe(true);
    }
  });

  it("keeps AKR-000010 within AKL-000030 scope and proof bounds", () => {
    const claim = required("AKL-000030");
    const relationship = required("AKR-000010");
    expect(claim.data).toMatchObject({
      semantic_scope: "claim-context-only",
      confidence: "medium",
      status: "sourced",
    });
    expect(relationship.data).toMatchObject({
      semantic_scope: "claim-context-only",
      confidence: "medium",
      strength: "moderate",
      evidence: ["AKL-000030"],
      traversal: { eligible: false },
    });
    expect(relationship.data.conditions).toEqual(claim.data.conditions);
    expect(asString(relationship.data.notes)).toMatch(/local durability boundary/iu);
  });
  it("places token and reconciliation failures on the actual failure-mode actors", () => {
    expect(required("AKR-000023").data).toMatchObject({
      subject: "AKC-000023",
      predicate: "can-occur-in-context-of",
      object: "AKC-000018",
    });
    expect(required("AKR-000024").data).toMatchObject({
      subject: "AKC-000024",
      predicate: "can-occur-in-context-of",
      object: "AKC-000010",
    });
    expect(traversalEligible("AKR-000023")).toBe(false);
    expect(traversalEligible("AKR-000024")).toBe(false);
  });

  it("keeps every production knowledge unit independently qualified", () => {
    for (const concept of model.concepts.filter((record) => record.markdown)) {
      for (const field of [
        "constraints",
        "assumptions",
        "risks",
        "alternatives",
        "examples",
        "counterexamples",
      ]) {
        expect(asArray(concept.data[field]), `${concept.id}.${field}`).not.toHaveLength(0);
      }
    }
  });

  it("records exactly one disposition family for every audit finding", async () => {
    const report = await readFile("docs/m3-semantic-remediation-report.md", "utf8");
    const ids = new Set(report.match(/M3-AUD-[0-9]{3}/gu));
    expect([...ids].sort()).toEqual(
      Array.from({ length: 16 }, (_, index) => `M3-AUD-${String(index + 1).padStart(3, "0")}`),
    );
  });

  function required(id: string): RecordEntry {
    const record = byId.get(id);
    if (!record) throw new Error(`Missing production record ${id}.`);
    return record;
  }

  function traversalEligible(id: string): boolean {
    const traversal = required(id).data.traversal;
    return isPlainObject(traversal) && traversal.eligible === true;
  }
});
