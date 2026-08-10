import { beforeAll, describe, expect, it, vi } from "vitest";

import { DeterministicFakeEmbeddingProvider } from "../src/embedding-provider.js";
import { buildGraphArtifacts } from "../src/graph-projector.js";
import { loadRepository } from "../src/model.js";
import { parseRetrievalRequest } from "../src/retrieval-query-contract.js";
import { parseRetrievalCliQuery } from "../src/retrieval-cli-arguments.js";
import {
  PostgresRetrievalStore,
  RetrievalEngine,
  applyBudget,
  fuseCandidates,
  graphExpansionPaths,
  rerankCandidates,
  type RetrievalStore,
} from "../src/retrieval-query.js";
import type { GraphArtifacts } from "../src/graph-types.js";
import type { GenerationRecord } from "../src/retrieval-indexer.js";
import type { RankedRow, RetrievalRequest, RetrievalUnit } from "../src/retrieval-types.js";

describe("M5 query contract and ranking", () => {
  let graph: GraphArtifacts;
  beforeAll(async () => {
    graph = buildGraphArtifacts(await loadRepository(process.cwd()));
  });

  it("fails closed for malformed and excessive requests", () => {
    expect(() => parseRetrievalRequest({ text: "x", surprise: true })).toThrow(
      "RETRIEVAL_QUERY_SHAPE",
    );
    expect(() => parseRetrievalRequest({ text: "", mode: "hybrid" })).toThrow("must not be empty");
    expect(() => parseRetrievalRequest({ text: "x", mode: "unknown" })).toThrow("unsupported mode");
    expect(() => parseRetrievalRequest({ text: "x", top_k: -1 })).toThrow("top_k");
    expect(() => parseRetrievalRequest({ text: "x", filters: { domains: "security" } })).toThrow(
      "string array",
    );
    expect(() =>
      parseRetrievalRequest({ text: "x", mode: "hybrid-graph", graph: { max_depth: 3 } }),
    ).toThrow("graph.max_depth");
    expect(() =>
      parseRetrievalRequest({ text: "x", filters: { minimum_confidence: "certain" } }),
    ).toThrow("minimum_confidence");
    expect(() =>
      parseRetrievalRequest({ text: "x", filters: { unit_kinds: ["unknown"] } }),
    ).toThrow("unknown kind");
    expect(() => parseRetrievalRequest({ text: "x", budget: { surprise: 1 } })).toThrow(
      "unsupported field",
    );
    expect(() => parseRetrievalRequest({ text: "x", explain: "yes" })).toThrow("boolean");
  });

  it("normalizes defaults and exact filter arrays", () => {
    expect(parseRetrievalRequest({ text: "query", mode: "hybrid" })).toMatchObject({
      top_k: 10,
      candidate_k: 40,
      explain: true,
      allow_degraded_lexical_fallback: false,
      graph: { enabled: false, max_depth: 1, predicates: [] },
      budget: { max_units: 10, max_estimated_tokens: 4000, max_units_per_concept: 3 },
    });
    expect(
      parseRetrievalRequest({ text: "q", filters: { domains: ["b", "a", "a"] } }).filters.domains,
    ).toEqual(["a", "b"]);
  });

  it("accepts package-manager separators, --text, positional text, and rejects CLI conflicts", async () => {
    await expect(
      parseRetrievalCliQuery(["--", "--text", "OIDC issuer", "--mode", "hybrid-graph"]),
    ).resolves.toMatchObject({
      text: "OIDC issuer",
      mode: "hybrid-graph",
      graph: { enabled: true },
    });
    await expect(
      parseRetrievalCliQuery(["positional query", "--top-k", "5"]),
    ).resolves.toMatchObject({
      text: "positional query",
      top_k: 5,
    });
    await expect(parseRetrievalCliQuery(["--text", "one", "two"])).rejects.toThrow(
      "RETRIEVAL_FLAG_CONFLICT",
    );
    await expect(parseRetrievalCliQuery(["--unknown", "x"])).rejects.toThrow(
      "RETRIEVAL_FILTER_UNSUPPORTED",
    );
  });

  it("uses weighted reciprocal ranks and deterministic ID ties without mixing raw scores", () => {
    const a = unit("ru:a", "AKC-1", "Alpha");
    const b = unit("ru:b", "AKC-2", "Beta");
    const fused = fuseCandidates(
      "query",
      [ranked(a, 1, 0.0001), ranked(b, 2, 999)],
      [ranked(b, 1, -10), ranked(a, 2, 10_000)],
    );
    const scores = rerankCandidates("query", fused);
    expect(scores.map((item) => item.unit.unit_id)).toEqual(["ru:a", "ru:b"]);
    expect(scores[0]?.score_breakdown.lexical_rrf).toBeCloseTo(1 / 61);
    expect(scores[0]?.score_breakdown.vector_rrf).toBeCloseTo(1 / 62);
    expect(fuseCandidates("query", [], [])).toEqual([]);
    expect(fuseCandidates("query", [], [ranked(a, 1, 1)])[0]).toMatchObject({
      lexical_rank: null,
      vector_rank: 1,
    });
  });

  it("boosts exact stable IDs and exact titles", () => {
    const candidate = fuseCandidates("AKC-1", [ranked(unit("ru:a", "AKC-1", "Alpha"), 10, 1)], []);
    expect(rerankCandidates("AKC-1", candidate)[0]?.score_breakdown.exact_match_boost).toBe(0.08);
    expect(rerankCandidates("Alpha", candidate)[0]?.score_breakdown.exact_match_boost).toBe(0.04);
  });

  it("enforces token, unit, and per-concept budgets without truncating a claim", () => {
    const request = validRequest({
      max_units: 3,
      max_estimated_tokens: 9,
      max_units_per_concept: 1,
    });
    const candidates = [
      unit("ru:a", "AKL-1", "A", "AKC-1", 6),
      unit("ru:b", "AKL-2", "B", "AKC-1", 2),
      unit("ru:c", "AKL-3", "C", "AKC-2", 5),
    ].map((value, index) => ({
      ...fuseCandidates("x", [ranked(value, index + 1, 1)], [])[0]!,
      score: 1 - index,
      score_breakdown: { lexical_rrf: 1, vector_rrf: 0, exact_match_boost: 0, graph_penalty: 0 },
      selection: { selected: false, reason: "" },
    }));
    const result = applyBudget(candidates, request);
    expect(result.results.map((item) => item.unit.unit_id)).toEqual(["ru:a"]);
    expect(result.decisions).toContainEqual({
      unit_id: "ru:b",
      selected: false,
      reason: "concept-diversity",
    });
    expect(result.decisions).toContainEqual({
      unit_id: "ru:c",
      selected: false,
      reason: "token-budget",
    });
    expect(result.results[0]?.unit.estimated_tokens).toBe(6);

    const exactBoundary = applyBudget(
      candidates,
      validRequest({ max_units: 1, max_estimated_tokens: 6, max_units_per_concept: 3 }),
    );
    expect(exactBoundary.results).toHaveLength(1);
    expect(exactBoundary.results[0]?.selection.selected).toBe(true);
    expect(exactBoundary.decisions[1]?.reason).toBe("max-units");
  });

  it("expands only M4 traversable directed and symmetric edges", () => {
    const retry = graphExpansionPaths(graph, ["AKC-000012"], 1, []);
    expect(retry.get("AKC-000013")?.relationshipIds).toEqual(["AKR-000008"]);
    const oidc = graphExpansionPaths(graph, ["AKC-000018"], 1, []);
    expect(oidc.get("AKC-000017")?.relationshipIds).toEqual(["AKR-000014"]);
    expect(graphExpansionPaths(graph, ["AKC-000017"], 1, []).has("AKC-000018")).toBe(false);
    expect(graphExpansionPaths(graph, ["AKC-000014"], 2, []).size).toBe(0);
    expect(graphExpansionPaths(graph, ["AKC-000012"], 0, []).size).toBe(0);
    expect(graphExpansionPaths(graph, ["AKC-000012"], 1, ["depends-on"]).size).toBe(0);
    expect([...retry.values()].flatMap((path) => path.relationshipIds)).not.toContain("AKR-000010");
    expect(() => graphExpansionPaths(graph, ["AKC-000012"], 3, [])).toThrow("DEPTH_INVALID");
    expect(() => graphExpansionPaths(graph, ["AKC-000012"], -1, [])).toThrow("DEPTH_INVALID");
    expect(() => graphExpansionPaths(graph, ["AKC-000012"], 0.5, [])).toThrow("DEPTH_INVALID");

    const excludedDefense = structuredClone(graph);
    const excluded = excludedDefense.edges.find((edge) => edge.relationship_id === "AKR-000010")!;
    excluded.traversable = true;
    expect(
      graphExpansionPaths(excludedDefense, [excluded.from], 1, []).get(excluded.to),
    ).toBeUndefined();

    const wrongFamily = structuredClone(graph);
    const fake = structuredClone(
      wrongFamily.edges.find((edge) => edge.relationship_id === "AKR-000008")!,
    );
    fake.family = "claim-applicable-to-concept";
    fake.traversable = true;
    wrongFamily.edges = [fake];
    expect(graphExpansionPaths(wrongFamily, [fake.from], 1, []).size).toBe(0);
  });

  it("applies graph penalties and every RRF contribution with descending score order", () => {
    const a = fuseCandidates("query", [ranked(unit("ru:a", "AKC-1", "Alpha"), 1, 1)], [])[0]!;
    const b = fuseCandidates("query", [], [ranked(unit("ru:b", "AKC-2", "Beta"), 1, 1)])[0]!;
    a.graph_distance = 1;
    const rankedResults = rerankCandidates("query", [a, b]);
    const penalized = rankedResults.find((item) => item.unit.unit_id === "ru:a")!;
    const vectorOnly = rankedResults.find((item) => item.unit.unit_id === "ru:b")!;
    expect(penalized.score_breakdown).toMatchObject({
      lexical_rrf: 1 / 61,
      vector_rrf: 0,
      graph_penalty: 0.008,
    });
    expect(vectorOnly.score_breakdown).toMatchObject({ lexical_rrf: 0, vector_rrf: 1 / 61 });
    expect(rankedResults[0]?.score).toBeGreaterThanOrEqual(rankedResults[1]!.score);
  });

  it("labels explicit lexical fallback instead of silently claiming hybrid", async () => {
    const store = new MemoryStore([ranked(unit("ru:a", "AKC-1", "Alpha"), 1, 1)]);
    const engine = new RetrievalEngine(
      store,
      new DeterministicFakeEmbeddingProvider({ fail: true }),
      graph,
      generation(),
    );
    const packet = await engine.query(
      parseRetrievalRequest({
        text: "Alpha",
        mode: "hybrid",
        allow_degraded_lexical_fallback: true,
      }),
    );
    expect(packet).toMatchObject({
      degraded: true,
      degradation_reason: "RETRIEVAL_EMBEDDING_FAKE_FAILURE",
    });
    await expect(
      engine.query(parseRetrievalRequest({ text: "Alpha", mode: "hybrid" })),
    ).rejects.toThrow("FAKE_FAILURE");
    const lexical = await engine.query(parseRetrievalRequest({ text: "Alpha", mode: "lexical" }));
    expect(lexical).toMatchObject({ degraded: false, result_count: 1, estimated_tokens: 10 });
    expect(lexical.diagnostics).toEqual([]);
    await expect(
      engine.query(
        parseRetrievalRequest({
          text: "Alpha",
          mode: "vector",
          allow_degraded_lexical_fallback: true,
        }),
      ),
    ).rejects.toThrow("FAKE_FAILURE");
  });

  it("expands hybrid-graph candidates through the governed store path only", async () => {
    const seed = ranked(unit("ru:seed", "AKC-000012", "Retry"), 1, 1);
    const expanded = unit("ru:expanded", "AKC-000013", "Retry Budget");
    const engine = new RetrievalEngine(
      new MemoryStore([seed], [expanded]),
      new DeterministicFakeEmbeddingProvider(),
      graph,
      generation(),
    );
    const packet = await engine.query(
      parseRetrievalRequest({ text: "retry", mode: "hybrid-graph" }),
    );
    expect(packet.results.find((item) => item.unit.unit_id === "ru:expanded")).toMatchObject({
      graph_distance: 1,
      graph_relationship_ids: ["AKR-000008"],
    });
  });

  it("keeps injection text in PostgreSQL parameters", async () => {
    const query = vi.fn(async () => ({ rows: [], rowCount: 0 }));
    const store = new PostgresRetrievalStore({ query } as never);
    const attack = "' OR 1=1; DROP TABLE retrieval_units; --";
    await store.lexical("generation", attack, validRequest().filters, 10);
    const call = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(call[0]).not.toContain(attack);
    expect(call[0]).toContain("LIMIT $3");
    expect(call[1]).toContain(attack);
    expect(call[1].at(-1)).toBe(10);
  });
});

function unit(
  id: string,
  recordId: string,
  title: string,
  conceptId: string | null = recordId,
  tokens = 10,
): RetrievalUnit {
  return {
    retrieval_unit_contract_version: 1,
    unit_id: id,
    unit_kind: recordId.startsWith("AKL") ? "claim" : "concept-overview",
    record_id: recordId,
    concept_id: conceptId,
    section_key: "overview",
    ordinal: 0,
    title,
    retrieval_text: title,
    content_hash: "sha256:test",
    estimated_tokens: tokens,
    metadata: { title, human_key: title.toLowerCase(), aliases: [] },
    source_path: "synthetic",
    lifecycle_status: "proposed",
    semantic_scope: null,
    confidence: null,
    citations: [],
  };
}

function ranked(value: RetrievalUnit, rank: number, score: number): RankedRow {
  return { unit: value, rank, score };
}

function validRequest(budget?: RetrievalRequest["budget"]): RetrievalRequest {
  return parseRetrievalRequest({
    text: "x",
    mode: "lexical",
    budget,
  });
}

function generation(): GenerationRecord {
  return {
    generation_id: "rg:test",
    repository_commit: "commit",
    graph_input_fingerprint: "sha256:graph",
    retrieval_manifest_root: "sha256:manifest",
    retrieval_unit_contract_version: 1,
    embedding_provider: "deterministic-fake",
    embedding_model: "token-hash-v1",
    embedding_dimension: 1536,
    embedding_contract_fingerprint: "sha256:embedding",
    normalization_version: "v1",
    chunking_version: "v1",
    created_by_tool_version: "v1",
    status: "active",
    unit_count: 1,
    manifest_hash: "sha256:db",
  };
}

class MemoryStore implements RetrievalStore {
  constructor(
    private readonly lexicalRows: RankedRow[],
    private readonly expandedUnits: RetrievalUnit[] = [],
  ) {}
  async lexical(): Promise<RankedRow[]> {
    return this.lexicalRows;
  }
  async vector(): Promise<RankedRow[]> {
    return [];
  }
  async forConcepts(): Promise<RetrievalUnit[]> {
    return this.expandedUnits;
  }
}
