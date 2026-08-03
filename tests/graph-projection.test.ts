import { beforeAll, describe, expect, it } from "vitest";

import { validateGraphArtifacts } from "../src/graph-artifacts.js";
import { buildGraphArtifacts, relationshipTraversalDecision } from "../src/graph-projector.js";
import { asStringArray } from "../src/io.js";
import { loadRepository, type RecordEntry, type RepositoryModel } from "../src/model.js";

describe("M4 graph projection production contract", () => {
  let model: RepositoryModel;
  let graph: ReturnType<typeof buildGraphArtifacts>;

  beforeAll(async () => {
    model = await loadRepository(process.cwd());
    graph = buildGraphArtifacts(model);
  });

  it("projects every governed family exactly once", () => {
    expect(graph.concepts).toHaveLength(model.concepts.length);
    expect(graph.claims).toHaveLength(model.claims.length);
    expect(graph.sources).toHaveLength(model.sources.length);
    expect(graph.relationships).toHaveLength(model.relationships.length);
    expect(new Set(graph.nodes.map((node) => node.id)).size).toBe(graph.nodes.length);
  });

  it("preserves stable IDs and normalized paths", () => {
    expect(graph.nodes.map((node) => node.id).sort()).toEqual(
      model.records.map((record) => record.id).sort(),
    );
    expect(graph.nodes.every((node) => !node.source_path.includes("\\"))).toBe(true);
  });

  it("projects current and previous human keys from the immutable ledger", () => {
    const oauth = graph.concepts.find((concept) => concept.id === "AKC-000017");
    expect(oauth?.human_key).toBe("oauth-2-0-authorization-framework");
    expect(oauth?.previous_human_keys).toEqual(["oauth-2x"]);
  });

  it("preserves structured concept qualifiers rather than flattening them", () => {
    const outbox = graph.concepts.find((concept) => concept.id === "AKC-000014");
    expect(outbox?.constraints).toEqual(
      model.concepts.find((item) => item.id === "AKC-000014")?.data.constraints,
    );
    expect(outbox?.risks).toEqual(
      model.concepts.find((item) => item.id === "AKC-000014")?.data.risks,
    );
  });

  it("preserves claim type, normative force, applicability, and exact locator", () => {
    const claim = graph.claims.find((record) => record.id === "AKL-000061");
    expect(claim?.claim_type).toBe("normalized-source-claim");
    expect(claim?.normative).toMatchObject({ force: "must" });
    expect(claim?.source_locations).toEqual([
      { source_id: "AKS-000019", locator: "OpenID Connect Core Section 3.1.3.7, item 2" },
    ]);
  });

  it("keeps direct and derived claim provenance distinct", () => {
    expect(graph.edges.some((edge) => edge.family === "claim-supported-by-source")).toBe(true);
    expect(graph.edges.some((edge) => edge.family === "claim-derived-from-claim")).toBe(true);
  });

  it("makes concept-to-claim-to-source provenance directly traversable", () => {
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        family: "concept-declares-claim",
        from: "AKC-000018",
        to: "AKL-000061",
      }),
    );
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        family: "claim-supported-by-source",
        from: "AKL-000061",
        to: "AKS-000019",
      }),
    );
  });

  it("makes relationship-to-claim-to-source provenance directly traversable", () => {
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        family: "relationship-supported-by-claim",
        from: "AKR-000014",
      }),
    );
    const relationship = graph.edges.find((edge) => edge.relationship_id === "AKR-000014");
    expect(relationship?.source_ids.length).toBeGreaterThan(0);
  });

  it("preserves relationship conditions and semantic scope", () => {
    const edge = graph.edges.find((item) => item.relationship_id === "AKR-000010");
    expect(edge?.conditions).toEqual(
      model.relationships.find((item) => item.id === "AKR-000010")?.data.conditions,
    );
    expect(edge?.semantic_scope).toBe("claim-context-only");
    expect(edge?.strength).toBe("moderate");
  });

  it("preserves every explicit exclusion decision", () => {
    const excluded = graph.relationships.filter((record) => record.traversal_eligible === false);
    expect(excluded.map((record) => record.id)).toEqual([
      "AKR-000001",
      "AKR-000005",
      "AKR-000006",
      "AKR-000007",
      "AKR-000009",
      "AKR-000010",
      "AKR-000013",
      "AKR-000015",
      "AKR-000016",
      "AKR-000017",
      "AKR-000018",
      "AKR-000019",
      "AKR-000021",
      "AKR-000022",
      "AKR-000023",
      "AKR-000024",
    ]);
    expect(excluded.every((record) => typeof record.traversal_exclusion_reason === "string")).toBe(
      true,
    );
  });

  it("allows only production relationships that satisfy the M3 traversal contract", () => {
    const eligible = graph.relationships.filter((record) => record.traversal_eligible === true);
    expect(eligible.map((record) => record.id)).toEqual([
      "AKR-000002",
      "AKR-000003",
      "AKR-000004",
      "AKR-000008",
      "AKR-000011",
      "AKR-000012",
      "AKR-000014",
      "AKR-000020",
    ]);
  });

  it("partitions every production relationship into traversable or excluded exactly once", () => {
    const all = model.relationships.map((record) => record.id).sort();
    const traversable = graph.relationships
      .filter((record) => record.traversal_eligible === true)
      .map((record) => record.id);
    const excluded = graph.relationships
      .filter((record) => record.traversal_eligible === false)
      .map((record) => record.id);
    expect(traversable.filter((id) => excluded.includes(id))).toEqual([]);
    expect([...traversable, ...excluded].sort()).toEqual(all);
  });

  it("projects each relationship once with original predicate and both adjacency views", () => {
    const relationshipEdges = graph.edges.filter((edge) => edge.family === "relationship");
    expect(relationshipEdges).toHaveLength(model.relationships.length);
    const forward = JSON.parse(graph.files.get("generated/graph/adjacency.json")!) as {
      records: Array<{ node_id: string; edge_ids: string[] }>;
    };
    const reverse = JSON.parse(graph.files.get("generated/graph/reverse-adjacency.json")!) as {
      records: Array<{ node_id: string; edge_ids: string[] }>;
    };
    for (const relationship of model.relationships) {
      const matches = relationshipEdges.filter((edge) => edge.relationship_id === relationship.id);
      expect(matches).toHaveLength(1);
      const edge = matches[0]!;
      expect(edge.predicate).toBe(relationship.data.predicate);
      expect(forward.records.find((record) => record.node_id === edge.from)?.edge_ids).toContain(
        edge.id,
      );
      expect(reverse.records.find((record) => record.node_id === edge.to)?.edge_ids).toContain(
        edge.id,
      );
      if (edge.direction === "symmetric") {
        expect(forward.records.find((record) => record.node_id === edge.to)?.edge_ids).toContain(
          edge.id,
        );
        expect(reverse.records.find((record) => record.node_id === edge.from)?.edge_ids).toContain(
          edge.id,
        );
      }
    }
  });

  it("reports relationship-record, semantic-edge, adjacency, and provenance counts separately", () => {
    expect(graph.manifest).toMatchObject({
      first_class_relationship_records: 24,
      semantic_relationship_edges: 24,
      forward_relationship_adjacency_entries: 31,
      reverse_relationship_adjacency_entries: 31,
      provenance_edges: 237,
    });
  });

  it("does not elevate any lifecycle state", () => {
    for (const record of model.records) {
      expect(graph.nodes.find((node) => node.id === record.id)?.status).toBe(record.data.status);
    }
  });

  it("reports zero unresolved references and zero invalid orphans", () => {
    expect(graph.manifest.unresolved_reference_count).toBe(0);
    expect(graph.manifest.invalid_orphan_count).toBe(0);
  });

  it("has a deterministic input-only fingerprint and no timestamp", () => {
    expect(graph.manifest.input_fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(JSON.stringify(graph.manifest)).not.toMatch(/generated_at|timestamp/i);
  });

  it("generates byte-identical artifacts twice", () => {
    const second = buildGraphArtifacts(model);
    expect([...second.files.entries()]).toEqual([...graph.files.entries()]);
  });

  it("passes the graph validator against the production repository", () => {
    expect(validateGraphArtifacts(model, graph)).toEqual([]);
  });

  it("fails closed for an explicitly excluded relationship", () => {
    const relationship = model.relationships.find((record) => record.id === "AKR-000010");
    expect(relationship).toBeDefined();
    expect(decision(relationship!, model).eligible).toBe(false);
    expect(decision(relationship!, model).reason).toContain("claim-context-only");
  });

  it("fails closed when an eligible relationship is proposed", () => {
    const original = model.relationships.find((record) => record.id === "AKR-000014")!;
    const relationship = changed(original, { status: "proposed" });
    expect(decision(relationship, model)).toEqual({
      eligible: false,
      reason: "policy:relationship-not-sourced",
    });
  });

  it("fails closed when eligible evidence is not sourced", () => {
    const original = model.relationships.find((record) => record.id === "AKR-000014")!;
    const claimId = (original.data.evidence as string[])[0]!;
    const claimById = new Map(model.claims.map((record) => [record.id, record]));
    claimById.set(claimId, changed(claimById.get(claimId)!, { status: "proposed" }));
    const sourceById = new Map(model.sources.map((record) => [record.id, record]));
    expect(relationshipTraversalDecision(original, claimById, sourceById)).toEqual({
      eligible: false,
      reason: "policy:relationship-evidence-not-sourced",
    });
  });

  it("fails closed when admitted source grounding is removed", () => {
    const original = model.relationships.find((record) => record.id === "AKR-000014")!;
    const claimById = new Map(model.claims.map((record) => [record.id, record]));
    const sourceById = new Map(model.sources.map((record) => [record.id, record]));
    const evidenceId = asStringArray(original.data.evidence)[0]!;
    const sourceId = asStringArray(claimById.get(evidenceId)?.data.sources)[0]!;
    sourceById.set(sourceId, changed(sourceById.get(sourceId)!, { status: "candidate" }));
    expect(relationshipTraversalDecision(original, claimById, sourceById).reason).toBe(
      "policy:evidence-chain-not-admitted",
    );
  });

  it.each([
    [{ semantic_scope: "claim-context-only" }, "policy:relationship-not-concept-global"],
    [{ evidence: [] }, "policy:relationship-evidence-missing"],
    [{ evidence: ["AKL-999999"] }, "policy:relationship-evidence-unresolved"],
  ])("fails closed for malformed eligible relationship evidence %#", (data, reason) => {
    const original = model.relationships.find((record) => record.id === "AKR-000014")!;
    expect(decision(changed(original, data), model)).toEqual({ eligible: false, reason });
  });

  it("fails closed when an eligible evidence claim is not sourced", () => {
    const original = model.relationships.find((record) => record.id === "AKR-000014")!;
    const claimId = asStringArray(original.data.evidence)[0]!;
    const claimById = new Map(model.claims.map((record) => [record.id, record]));
    claimById.set(claimId, changed(claimById.get(claimId)!, { status: "proposed" }));
    expect(
      relationshipTraversalDecision(
        original,
        claimById,
        new Map(model.sources.map((record) => [record.id, record])),
      ),
    ).toEqual({ eligible: false, reason: "policy:relationship-evidence-not-sourced" });
  });

  it("fails closed for causal quality edges backed by inferential evidence", () => {
    const original = model.relationships.find((record) => record.id === "AKR-000014")!;
    const claimId = asStringArray(original.data.evidence)[0]!;
    const claimById = new Map(model.claims.map((record) => [record.id, record]));
    claimById.set(claimId, changed(claimById.get(claimId)!, { claim_type: "inference" }));
    const relationship = changed(original, { predicate: "improves" });
    expect(
      relationshipTraversalDecision(
        relationship,
        claimById,
        new Map(model.sources.map((record) => [record.id, record])),
      ),
    ).toEqual({ eligible: false, reason: "policy:quality-impact-evidence-ineligible" });
  });

  it("fails closed for an ungrounded or cyclic derivation branch", () => {
    const original = model.relationships.find((record) => record.id === "AKR-000014")!;
    const claimId = asStringArray(original.data.evidence)[0]!;
    const claimById = new Map(model.claims.map((record) => [record.id, record]));
    claimById.set(
      claimId,
      changed(claimById.get(claimId)!, {
        sources: [],
        derived_from_claims: [claimId],
      }),
    );
    expect(
      relationshipTraversalDecision(
        original,
        claimById,
        new Map(model.sources.map((record) => [record.id, record])),
      ),
    ).toEqual({ eligible: false, reason: "policy:evidence-chain-not-admitted" });
  });

  it.each([
    { sources: [], derived_from_claims: [] },
    { sources: [], derived_from_claims: ["AKL-999999"] },
  ])("fails closed for a claim with no complete admitted grounding %#", (claimData) => {
    const original = model.relationships.find((record) => record.id === "AKR-000014")!;
    const claimId = asStringArray(original.data.evidence)[0]!;
    const claimById = new Map(model.claims.map((record) => [record.id, record]));
    claimById.set(claimId, changed(claimById.get(claimId)!, claimData));
    expect(
      relationshipTraversalDecision(
        original,
        claimById,
        new Map(model.sources.map((record) => [record.id, record])),
      ),
    ).toEqual({ eligible: false, reason: "policy:evidence-chain-not-admitted" });
  });

  it("accepts a fully grounded eligible edge when its admitted source is restricted", () => {
    const original = model.relationships.find((record) => record.id === "AKR-000014")!;
    const claimId = asStringArray(original.data.evidence)[0]!;
    const claimById = new Map(model.claims.map((record) => [record.id, record]));
    const sourceId = asStringArray(claimById.get(claimId)?.data.sources)[0]!;
    const sourceById = new Map(model.sources.map((record) => [record.id, record]));
    sourceById.set(sourceId, changed(sourceById.get(sourceId)!, { status: "restricted" }));
    expect(relationshipTraversalDecision(original, claimById, sourceById)).toEqual({
      eligible: true,
      reason: null,
    });
  });
});

function decision(relationship: RecordEntry, model: RepositoryModel) {
  return relationshipTraversalDecision(
    relationship,
    new Map(model.claims.map((record) => [record.id, record])),
    new Map(model.sources.map((record) => [record.id, record])),
  );
}

function changed(record: RecordEntry, data: Record<string, unknown>): RecordEntry {
  return { ...record, data: { ...record.data, ...data } };
}
