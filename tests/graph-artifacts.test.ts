import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  checkGraphArtifacts,
  loadCommittedGraph,
  validateGraphArtifacts,
  writeGraphArtifacts,
} from "../src/graph-artifacts.js";
import { buildGraphArtifacts } from "../src/graph-projector.js";
import type { GraphArtifacts, GraphEdge, GraphNode } from "../src/graph-types.js";
import { loadRepository, type RepositoryModel } from "../src/model.js";

describe("M4 graph validation and currentness", () => {
  let model: RepositoryModel;
  let graph: GraphArtifacts;
  const temporaryDirectories = new Set<string>();

  beforeAll(async () => {
    model = await loadRepository(process.cwd());
    graph = buildGraphArtifacts(model);
  });

  afterEach(async () => {
    await Promise.all(
      [...temporaryDirectories].map((directory) => rm(directory, { recursive: true, force: true })),
    );
    temporaryDirectories.clear();
  });

  it("writes all artifacts and proves byte-identical regeneration", async () => {
    const directory = await temporaryDirectory("aks-graph-");
    const first = await writeGraphArtifacts(directory, graph);
    const firstBytes = await Promise.all(
      first.map((file) => readFile(path.join(directory, file), "utf8")),
    );
    await writeGraphArtifacts(directory, buildGraphArtifacts(model));
    const secondBytes = await Promise.all(
      first.map((file) => readFile(path.join(directory, file), "utf8")),
    );
    expect(firstBytes).toEqual(secondBytes);
    expect(await checkGraphArtifacts(directory, graph)).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: "current" })]),
    );
  });

  it("detects a stale artifact without changing it", async () => {
    const directory = await temporaryDirectory("aks-graph-stale-");
    await writeGraphArtifacts(directory, graph);
    const target = "generated/graph/manifest.json";
    await writeFile(path.join(directory, target), "{}\n", "utf8");
    expect(await checkGraphArtifacts(directory, graph)).toContainEqual({
      path: target,
      status: "stale",
    });
    expect(await readFile(path.join(directory, target), "utf8")).toBe("{}\n");
  });

  it("detects a missing artifact", async () => {
    const directory = await temporaryDirectory("aks-graph-missing-");
    await writeGraphArtifacts(directory, graph);
    const target = "generated/graph/edges.json";
    await rm(path.join(directory, target));
    expect(await checkGraphArtifacts(directory, graph)).toContainEqual({
      path: target,
      status: "missing",
    });
  });

  it("loads committed artifacts using the versioned contract", async () => {
    const loaded = await loadCommittedGraph(process.cwd());
    expect(loaded.nodes.length).toBe(graph.nodes.length);
    expect(loaded.edges.length).toBe(graph.edges.length);
  });

  it("rejects graph schema-version mismatch while loading", async () => {
    const directory = await temporaryDirectory("aks-graph-version-");
    await writeGraphArtifacts(directory, graph);
    const target = path.join(directory, "generated/graph/graph.json");
    const value = JSON.parse(await readFile(target, "utf8")) as Record<string, unknown>;
    value.graph_contract_version = 999;
    await writeFile(target, `${JSON.stringify(value)}\n`, "utf8");
    await expect(loadCommittedGraph(directory)).rejects.toThrow("GRAPH_SCHEMA_VERSION");
  });

  it("detects duplicate nodes", () => {
    const mutated = cloneGraph(graph);
    mutated.nodes.push(structuredClone(mutated.nodes[0]!));
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_DUPLICATE_NODE");
  });

  it("detects duplicate edges", () => {
    const mutated = cloneGraph(graph);
    mutated.edges.push(structuredClone(mutated.edges[0]!));
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_DUPLICATE_EDGE");
  });

  it("detects unresolved endpoints", () => {
    const mutated = cloneGraph(graph);
    mutated.edges[0] = { ...mutated.edges[0]!, to: "AKC-999999" };
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_UNRESOLVED_ENDPOINT");
  });

  it("detects traversable provenance edges", () => {
    const mutated = cloneGraph(graph);
    const index = mutated.edges.findIndex((edge) => edge.family !== "relationship");
    mutated.edges[index] = { ...mutated.edges[index]!, traversable: true };
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_PROVENANCE_TRAVERSABLE");
  });

  it("detects an excluded edge missing its explanation", () => {
    const mutated = cloneGraph(graph);
    const index = mutated.edges.findIndex((edge) => edge.relationship_id === "AKR-000010");
    mutated.edges[index] = { ...mutated.edges[index]!, traversal_exclusion_reason: null };
    expect(codes(validateGraphArtifacts(model, mutated))).toContain(
      "GRAPH_EXCLUSION_REASON_MISSING",
    );
  });

  it("detects a traversable edge violating repository policy", () => {
    const mutated = cloneGraph(graph);
    const index = mutated.edges.findIndex((edge) => edge.relationship_id === "AKR-000010");
    mutated.edges[index] = { ...mutated.edges[index]!, traversable: true };
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_TRAVERSAL_POLICY");
  });

  it("detects lost relationship conditions", () => {
    const mutated = cloneGraph(graph);
    const index = mutated.edges.findIndex((edge) => edge.relationship_id === "AKR-000014");
    mutated.edges[index] = { ...mutated.edges[index]!, conditions: [] };
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_EDGE_CONDITION_LOST");
  });

  it("detects lost semantic scope", () => {
    const mutated = cloneGraph(graph);
    const index = mutated.edges.findIndex((edge) => edge.relationship_id === "AKR-000014");
    mutated.edges[index] = { ...mutated.edges[index]!, semantic_scope: null };
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_SEMANTIC_SCOPE_LOST");
  });

  it("detects lost claim evidence", () => {
    const mutated = cloneGraph(graph);
    mutated.edges = mutated.edges.filter(
      (edge) => edge.id !== "edge:claim-source:AKL-000061:AKS-000019",
    );
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_CLAIM_EVIDENCE_MISSING");
  });

  it("detects lost exact source locators", () => {
    const mutated = cloneGraph(graph);
    const index = mutated.edges.findIndex(
      (edge) => edge.id === "edge:claim-source:AKL-000061:AKS-000019",
    );
    mutated.edges[index] = { ...mutated.edges[index]!, source_locations: [] };
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_SOURCE_LOCATOR_LOST");
  });

  it("detects graph/index count disagreement", () => {
    const mutated = cloneGraph(graph);
    mutated.concepts.pop();
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_INDEX_COUNT");
  });

  it("detects forward adjacency disagreement", () => {
    const mutated = cloneGraph(graph);
    mutated.files.set(
      "generated/graph/adjacency.json",
      '{"artifact_type":"forward-adjacency","graph_contract_version":1,"records":[]}\n',
    );
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_ADJACENCY");
  });

  it("detects reverse adjacency disagreement", () => {
    const mutated = cloneGraph(graph);
    mutated.files.set(
      "generated/graph/reverse-adjacency.json",
      '{"artifact_type":"reverse-adjacency","graph_contract_version":1,"records":[]}\n',
    );
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_REVERSE_ADJACENCY");
  });

  it("detects artifact contract-version mismatch", () => {
    const mutated = cloneGraph(graph);
    mutated.files.set(
      "generated/graph/nodes.json",
      '{"artifact_type":"nodes","graph_contract_version":2,"records":[]}\n',
    );
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_SCHEMA_VERSION");
  });

  it("detects platform-dependent generated paths", () => {
    const mutated = cloneGraph(graph);
    mutated.files.set(
      "generated/graph/nodes.json",
      '{"artifact_type":"nodes","graph_contract_version":1,"records":[{"source_path":"knowledge\\\\x.md"}]}\n',
    );
    expect(codes(validateGraphArtifacts(model, mutated))).toContain("GRAPH_PLATFORM_PATH");
  });

  it("keeps production graph references resolved", () => {
    expect(validateGraphArtifacts(model, graph)).toEqual([]);
    expect(graph.manifest.unresolved_reference_count).toBe(0);
  });

  async function temporaryDirectory(prefix: string): Promise<string> {
    const directory = await mkdtemp(path.join(tmpdir(), prefix));
    temporaryDirectories.add(directory);
    return directory;
  }
});

function codes(diagnostics: ReturnType<typeof validateGraphArtifacts>): string[] {
  return diagnostics.map((item) => item.code);
}

function cloneGraph(graph: GraphArtifacts): GraphArtifacts {
  return {
    files: new Map(graph.files),
    nodes: structuredClone(graph.nodes) as GraphNode[],
    edges: structuredClone(graph.edges) as GraphEdge[],
    concepts: structuredClone(graph.concepts),
    claims: structuredClone(graph.claims),
    sources: structuredClone(graph.sources),
    relationships: structuredClone(graph.relationships),
    manifest: structuredClone(graph.manifest),
    traversalPolicy: structuredClone(graph.traversalPolicy),
  };
}
