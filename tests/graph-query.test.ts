import { beforeAll, describe, expect, it } from "vitest";

import { buildGraphArtifacts } from "../src/graph-projector.js";
import { GraphQueryEngine } from "../src/graph-query.js";
import type { GraphArtifacts } from "../src/graph-types.js";
import { loadRepository } from "../src/model.js";
import { recordFromData } from "./helpers.js";

describe("M4 graph query engine", () => {
  let engine: GraphQueryEngine;
  let graph: GraphArtifacts;

  beforeAll(async () => {
    graph = buildGraphArtifacts(await loadRepository(process.cwd()));
    engine = new GraphQueryEngine(graph);
  });

  it("gets every record family by stable ID", () => {
    expect(engine.get("AKC-000018").results[0]).toMatchObject({ family: "concept" });
    expect(engine.get("AKL-000061").results[0]).toMatchObject({ family: "claim" });
    expect(engine.get("AKR-000010").results[0]).toMatchObject({ family: "relationship" });
    expect(engine.get("AKS-000019").results[0]).toMatchObject({ family: "source" });
  });

  it("gets, lists, and finds dependents for a first-class decision guide", async () => {
    const model = await loadRepository(process.cwd());
    const guide = recordFromData(
      {
        id: "AKG-900001",
        record_kind: "decision-guide",
        title: "Synthetic query guide",
        status: "proposed",
        evidence: ["AKL-000061"],
        options: [{ concept_id: "AKC-000018" }],
        constraints: [],
        quality_attributes: [],
      },
      "tests/fixtures/synthetic/AKG-900001.yaml",
    );
    model.records.push(guide);
    model.decisionGuides = [guide];
    const guideEngine = new GraphQueryEngine(buildGraphArtifacts(model));
    expect(guideEngine.get("AKG-900001").results[0]).toMatchObject({ family: "decision-guide" });
    expect(guideEngine.list("decision-guides", { status: ["proposed"] }).result_count).toBe(1);
    expect(guideEngine.dependents("AKL-000061").results).toEqual(
      expect.arrayContaining([expect.objectContaining({ referencing_record_id: "AKG-900001" })]),
    );
  });

  it("resolves an exact current human key without fuzzy matching", () => {
    expect(engine.get("openid-connect").result_count).toBe(1);
    expect(engine.get("openid").diagnostics[0]?.code).toBe("GRAPH_ID_UNKNOWN");
  });

  it("returns a deterministic unknown-ID diagnostic", () => {
    expect(engine.get("AKC-999999")).toMatchObject({
      result_count: 0,
      diagnostics: [{ code: "GRAPH_ID_UNKNOWN" }],
    });
  });

  it("returns only traversal-eligible neighbors by default", () => {
    const result = engine.neighbors("AKC-000014");
    expect(result.results).toEqual([]);
  });

  it("labels excluded neighbors only when explicitly included", () => {
    const result = engine.neighbors("AKC-000014", { includeExcluded: true });
    expect(result.result_count).toBe(2);
    expect(JSON.stringify(result.results)).toContain("traversal_exclusion_reason");
  });

  it("supports exact predicate filtering", () => {
    const result = engine.neighbors("AKC-000008", { predicates: ["compatible-with"] });
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ neighbor_id: "AKC-000010" });
  });

  it("distinguishes outgoing and incoming inspection without inventing an inverse", () => {
    expect(engine.neighbors("AKC-000017", { direction: "incoming" }).results).toEqual([
      expect.objectContaining({
        neighbor_id: "AKC-000018",
        orientation: "incoming",
        edge: expect.objectContaining({ predicate: "depends-on" }),
      }),
    ]);
    expect(JSON.stringify(engine.neighbors("AKC-000017", { direction: "incoming" }))).not.toContain(
      "depended-on-by",
    );
    expect(engine.neighbors("AKC-000017", { direction: "outgoing" }).results).toEqual([]);
    expect(engine.neighbors("AKC-000018", { direction: "incoming" }).results).toEqual([]);
  });

  it("inspects symmetric edges from either endpoint without duplicating storage", () => {
    expect(engine.neighbors("AKC-000012").results[0]).toMatchObject({
      neighbor_id: "AKC-000013",
      orientation: "symmetric",
    });
    expect(engine.neighbors("AKC-000013").results[0]).toMatchObject({
      neighbor_id: "AKC-000012",
      orientation: "symmetric",
    });
    expect(engine.neighbors("AKC-000012", { direction: "incoming" }).result_count).toBe(1);
    expect(engine.neighbors("AKC-000013", { direction: "outgoing" }).result_count).toBe(1);
  });

  it("returns deterministic multi-hop paths with full edge provenance", () => {
    const result = engine.paths("AKC-000008", "AKC-000016", { maxDepth: 2 });
    expect(result.results).toContainEqual(
      expect.objectContaining({
        node_ids: ["AKC-000008", "AKC-000010", "AKC-000016"],
        relationship_ids: ["AKR-000004", "AKR-000012"],
        depth: 2,
      }),
    );
    expect(JSON.stringify(result.results)).toContain("source_ids");
  });

  it("returns an empty result rather than a fabricated path", () => {
    expect(engine.paths("AKC-000013", "AKC-000016", { maxDepth: 4 }).results).toEqual([]);
  });

  it("enforces maximum depth", () => {
    expect(engine.paths("AKC-000008", "AKC-000016", { maxDepth: 1 }).results).toEqual([]);
  });

  it("rejects zero, non-integer, and above-hard-limit depths", () => {
    expect(() => engine.traverse("AKC-000008", { maxDepth: 0 })).toThrow("GRAPH_DEPTH_INVALID");
    expect(() => engine.traverse("AKC-000008", { maxDepth: 1.5 })).toThrow("GRAPH_DEPTH_INVALID");
    expect(() => engine.traverse("AKC-000008", { maxDepth: 9 })).toThrow("GRAPH_DEPTH_INVALID");
  });

  it("terminates cycles and never returns the start node twice", () => {
    const result = engine.traverse("AKC-000012", { direction: "both", maxDepth: 8 });
    for (const item of result.results as Array<{ node_ids: string[] }>) {
      expect(new Set(item.node_ids).size).toBe(item.node_ids.length);
    }
  });

  it("never permits an excluded edge in traversable paths", () => {
    const result = engine.traverse("AKC-000014", { direction: "both", maxDepth: 8 });
    expect(JSON.stringify(result.results)).not.toContain("AKR-000010");
  });

  it("proves every excluded production relationship is absent from all default paths", () => {
    const excludedIds = new Set(
      graph.relationships
        .filter((relationship) => relationship.traversal_eligible === false)
        .map((relationship) => relationship.id),
    );
    const traversedIds = new Set<string>();
    for (const concept of graph.concepts) {
      const result = engine.traverse(concept.id, { direction: "both", maxDepth: 8 });
      for (const path of result.results as Array<{ relationship_ids: string[] }>) {
        for (const relationshipId of path.relationship_ids) traversedIds.add(relationshipId);
      }
    }
    expect([...excludedIds].filter((id) => traversedIds.has(id))).toEqual([]);
  });

  it("supports concept-type and domain traversal filters", () => {
    expect(
      engine.traverse("AKC-000008", {
        conceptTypes: ["architectural-style"],
        domains: ["integration"],
      }).results,
    ).toEqual([expect.objectContaining({ node_ids: ["AKC-000008", "AKC-000010"] })]);
  });

  it("queries claims by semantic and evidence metadata", () => {
    const result = engine.claimsForConcept("AKC-000018", {
      claim_type: ["normalized-source-claim"],
      normative_force: ["must"],
      source: ["AKS-000019"],
    });
    expect(result.results.length).toBeGreaterThan(0);
    expect(
      result.results.every(
        (item) => (item as Record<string, unknown>).claim_type === "normalized-source-claim",
      ),
    ).toBe(true);
  });

  it("keeps direct evidence, locators, and derived evidence separate", () => {
    const result = engine.evidenceForClaim("AKL-000061");
    expect(result.results[0]).toMatchObject({
      claim_id: "AKL-000061",
      direct_evidence: {
        source_ids: ["AKS-000019"],
        source_locations: [
          { source_id: "AKS-000019", locator: "OpenID Connect Core Section 3.1.3.7, item 2" },
        ],
      },
      derived_evidence: { claim_ids: [] },
    });
  });

  it("explains both eligible and excluded relationship traversal", () => {
    expect(engine.explainRelationship("AKR-000014").results[0]).toMatchObject({
      strength: "moderate",
      traversal: { eligible: true, exclusion_reason: null, multi_hop_eligible: true },
    });
    expect(engine.explainRelationship("AKR-000010").results[0]).toMatchObject({
      traversal: { eligible: false, multi_hop_eligible: false },
    });
  });

  it("finds reverse dependents without claiming inverse semantics", () => {
    const result = engine.dependents("AKS-000019");
    expect(result.result_count).toBeGreaterThan(0);
    expect(result.results).toContainEqual(
      expect.objectContaining({
        referencing_record_id: "AKL-000061",
        reverse_semantic_interpretation: false,
      }),
    );
  });

  it("filters every index using exact structured metadata", () => {
    expect(
      engine.list("concepts", { type: ["protocol"], domain: ["security-privacy"] }).result_count,
    ).toBe(2);
    expect(
      engine.list("relationships", { traversal_eligible: ["false"], status: ["proposed"] })
        .result_count,
    ).toBe(4);
    expect(
      engine.list("sources", { status: ["approved"], domain: ["security-privacy"] }).result_count,
    ).toBeGreaterThan(0);
  });

  it("rejects unsupported index filters deterministically", () => {
    expect(engine.list("concepts", { fuzzy: ["protocol"] }).diagnostics[0]?.code).toBe(
      "GRAPH_QUERY_FILTER",
    );
  });

  it("executes a non-empty structured multi-constraint query", () => {
    const result = engine.structured({
      node: { types: ["protocol"] },
      relationships: [{ predicate: "depends-on", target: "AKC-000017" }],
      traversable_only: true,
    });
    expect(result.results).toEqual([expect.objectContaining({ id: "AKC-000018" })]);
  });

  it("applies type, domain, and status node filters conjunctively", () => {
    const result = engine.structured({
      node: {
        types: ["protocol"],
        domains: ["security-privacy"],
        statuses: ["drafted"],
      },
    });
    expect(result.results.map((record) => (record as { id: string }).id)).toEqual([
      "AKC-000017",
      "AKC-000018",
    ]);
    expect(result.diagnostics).toEqual([]);
    expect(
      engine.structured({
        node: { types: ["protocol"], domains: ["integration"] },
      }).results,
    ).toEqual([]);
  });

  it("includes a governed excluded edge only when structured traversal opts out", () => {
    const contract = {
      node: { types: ["tactic"] },
      relationships: [{ predicate: "requires", target: "AKC-000011" }],
    };
    expect(engine.structured(contract).results).toEqual([]);
    expect(engine.structured({ ...contract, traversable_only: false }).results).toEqual([
      expect.objectContaining({ id: "AKC-000012" }),
    ]);
  });

  it("rejects unknown and non-concept structured targets", () => {
    for (const target of ["AKC-999999", "AKS-000019"]) {
      const result = engine.structured({
        relationships: [{ predicate: "depends-on", target }],
      });
      expect(result.result_count).toBe(0);
      expect(result.diagnostics[0]?.code).toBe("GRAPH_QUERY_TARGET");
    }
  });

  it("does not ignore a mismatched structured relationship predicate", () => {
    const result = engine.structured({
      node: { types: ["protocol"] },
      relationships: [{ predicate: "compatible-with", target: "AKC-000017" }],
    });
    expect(result.results).toEqual([]);
    expect(result.diagnostics[0]?.code).toBe("GRAPH_QUERY_EMPTY");
  });

  it("reports an ambiguous exact title rather than selecting one record", () => {
    const mutated = structuredClone(graph);
    mutated.concepts[0] = { ...mutated.concepts[0]!, title: "OpenID Connect" };
    const result = new GraphQueryEngine(mutated).get("OpenID Connect");
    expect(result.result_count).toBe(0);
    expect(result.diagnostics[0]?.code).toBe("GRAPH_ID_AMBIGUOUS");
  });

  it("rejects a non-object relationship constraint", () => {
    const result = engine.structured({ relationships: ["bad"] });
    expect(result.result_count).toBe(0);
    expect(result.diagnostics[0]?.code).toBe("GRAPH_QUERY_SHAPE");
  });

  it("rejects a non-object structured query", () => {
    const result = engine.structured([]);
    expect(result.result_count).toBe(0);
    expect(result.diagnostics[0]?.code).toBe("GRAPH_QUERY_SHAPE");
  });

  it("does not reinterpret a directed structured constraint in reverse", () => {
    const result = engine.structured({
      node: { types: ["protocol"] },
      relationships: [{ predicate: "depends-on", target: "AKC-000018" }],
      traversable_only: true,
    });
    expect(result.results).toEqual([]);
  });

  it("matches a governed symmetric structured constraint from either endpoint", () => {
    const reverseStoredOrder = engine.structured({
      node: { types: ["quality-attribute"] },
      relationships: [{ predicate: "overlaps-with", target: "AKC-000004" }],
      traversable_only: true,
    });
    expect(reverseStoredOrder.results).toEqual([expect.objectContaining({ id: "AKC-000005" })]);
    const storedOrder = engine.structured({
      node: { types: ["quality-attribute"] },
      relationships: [{ predicate: "overlaps-with", target: "AKC-000005" }],
      traversable_only: true,
    });
    expect(storedOrder.results).toEqual([expect.objectContaining({ id: "AKC-000004" })]);
  });

  it("explains a correct empty structured result", () => {
    const result = engine.structured({
      node: { types: ["architectural-pattern"] },
      relationships: [
        { predicate: "requires", target: "AKC-000011" },
        { predicate: "introduces", target: "AKC-000016" },
      ],
      traversable_only: true,
    });
    expect(result.results).toEqual([]);
    expect(result.diagnostics[0]?.code).toBe("GRAPH_QUERY_EMPTY");
  });

  it("rejects malformed structured constraints", () => {
    expect(
      engine.structured({ relationships: [{ predicate: "requires" }] }).diagnostics[0]?.code,
    ).toBe("GRAPH_QUERY_SHAPE");
  });

  it.each([
    { node: { fuzzy: ["oidc"] } },
    { node: { types: "protocol" } },
    { relationships: "bad" },
    { traversable_only: "false" },
    { unexpected: true },
    { relationships: [{ predicate: "depends-on", target: "AKC-000017", inverse: true }] },
  ])("rejects unsupported structured query shapes instead of broadening them", (query) => {
    const result = engine.structured(query);
    expect(result.result_count).toBe(0);
    expect(result.diagnostics[0]?.code).toBe("GRAPH_QUERY_SHAPE");
  });

  it("uses the stable query envelope for all successful queries", () => {
    expect(engine.get("AKC-000018")).toEqual(
      expect.objectContaining({
        query: expect.any(Object),
        result_count: 1,
        results: expect.any(Array),
        diagnostics: [],
        graph_contract_version: 2,
      }),
    );
  });
});
