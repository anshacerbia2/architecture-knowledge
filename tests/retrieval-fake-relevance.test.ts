import { beforeAll, describe, expect, it, vi } from "vitest";

import { DeterministicFakeEmbeddingProvider } from "../src/embedding-provider.js";
import { fakeEmbeddingHasTokenOverlap } from "../src/fake-embedding-relevance.js";
import type { GraphArtifacts } from "../src/graph-types.js";
import { createRagCitationAuthority } from "../src/rag-citation-authority.js";
import { RagEngine } from "../src/rag-engine.js";
import { evaluateRag, loadRagGolden } from "../src/rag-evaluation.js";
import { DeterministicFakeRagProvider } from "../src/rag-provider.js";
import { loadValidatedGraph } from "../src/retrieval-artifacts.js";
import { MIN_VECTOR_SIMILARITY } from "../src/retrieval-config.js";
import type { GenerationRecord } from "../src/retrieval-indexer.js";
import { parseRetrievalRequest } from "../src/retrieval-query-contract.js";
import { RetrievalEngine, type RetrievalStore } from "../src/retrieval-query.js";
import { buildRetrievalArtifacts } from "../src/retrieval-units.js";
import type { EmbeddingProvider, RankedRow, RetrievalUnit } from "../src/retrieval-types.js";
import { retrievalUnit } from "./rag-helpers.js";

describe("fake-vector candidate relevance regression", () => {
  let graph: GraphArtifacts;
  let claims: RetrievalUnit[];
  const provider = new DeterministicFakeEmbeddingProvider();
  const generation: GenerationRecord = {
    generation_id: "rg:fixture",
    repository_commit: "fixture",
    graph_input_fingerprint: "sha256:fixture",
    retrieval_manifest_root: "sha256:fixture",
    retrieval_unit_contract_version: 2,
    embedding_provider: provider.provider,
    embedding_model: provider.model,
    embedding_dimension: provider.dimension,
    embedding_contract_fingerprint: provider.contractFingerprint,
    normalization_version: "fixture",
    chunking_version: "fixture",
    created_by_tool_version: "fixture",
    status: "active",
    unit_count: 0,
    manifest_hash: null,
  };
  beforeAll(async () => {
    graph = await loadValidatedGraph(process.cwd());
    claims = buildRetrievalArtifacts(graph).units.filter((unit) => unit.unit_kind === "claim");
  });

  it("preserves the governed RAG invocation and safety contracts after corpus growth without a DB", async () => {
    // Exact fake vectors plus a limited all-token lexical fixture: this is NOT
    // PostgreSQL full-text/ranking or pgvector runtime evidence.
    const vectors = await provider.embedDocuments(claims.map((unit) => unit.retrieval_text));
    const store: RetrievalStore = {
      lexical: async (_generation, text, _filters, limit) => {
        const terms = text.toLowerCase().match(/[\p{L}\p{N}-]+/gu) ?? [];
        return claims
          .filter((unit) => terms.every((term) => unit.retrieval_text.toLowerCase().includes(term)))
          .sort((a, b) => a.unit_id.localeCompare(b.unit_id, "en"))
          .slice(0, limit)
          .map((unit, index) => ({ unit, rank: index + 1, score: 1 }));
      },
      vector: async (_generation, query, filters, limit) => {
        expect(filters).toEqual(
          parseRetrievalRequest({ text: "fixture", filters: { unit_kinds: ["claim"] } }).filters,
        );
        return claims
          .map((unit, index) => ({
            unit,
            score: vectors[index]!.reduce((sum, value, axis) => sum + value * query[axis]!, 0),
          }))
          .filter((row) => row.score >= MIN_VECTOR_SIMILARITY)
          .sort((a, b) => b.score - a.score || a.unit.unit_id.localeCompare(b.unit.unit_id, "en"))
          .slice(0, limit)
          .map((row, index) => ({ ...row, rank: index + 1 }));
      },
      forConcepts: async (_generation, ids, _filters, limit) =>
        claims
          .filter((unit) => ids.includes(unit.concept_id!))
          .sort((a, b) => a.unit_id.localeCompare(b.unit_id, "en"))
          .slice(0, limit),
    };
    const engine = new RagEngine(
      new RetrievalEngine(store, provider, graph, generation),
      new DeterministicFakeRagProvider(),
      createRagCitationAuthority(graph),
    );
    const benchmark = await loadRagGolden("evaluation/rag-golden.yaml");
    const report = await evaluateRag(benchmark, (request) => engine.answer(request));
    expect(report.gates).toEqual({ passed: true, failures: [] });
    expect(report.metrics.model_invocation_accuracy).toBe(1);
    expect(report.metrics.prohibited_output_count).toBe(0);
  });

  it("rejects hash-only fake seeds before graph expansion but keeps meaningful matches", async () => {
    const unrelated = retrievalUnit({
      retrieval_text: "A a a a synthetic orange orchard.",
      unit_id: "ru:unrelated",
    });
    const relevant = retrievalUnit({
      retrieval_text: "Synthetic quantum storage.",
      unit_id: "ru:relevant",
    });
    const rows: RankedRow[] = [
      { unit: unrelated, score: 0.9, rank: 1 },
      { unit: relevant, score: 0.8, rank: 2 },
    ];
    const forConcepts = vi.fn(async () => []);
    const store: RetrievalStore = {
      lexical: async () => [],
      vector: async () => rows,
      forConcepts,
    };
    const request = parseRetrievalRequest({
      text: "How should a quantum processor operate?",
      mode: "vector",
    });
    const result = await new RetrievalEngine(store, provider, graph, generation).query(request);
    expect(result.results.map((row) => row.unit.unit_id)).toEqual(["ru:relevant"]);
    expect(result.selection_decisions).toContainEqual({
      unit_id: "ru:unrelated",
      selected: false,
      reason: "fake-vector-no-token-overlap",
    });
    const empty = await new RetrievalEngine(
      { ...store, vector: async () => [rows[0]!] },
      provider,
      graph,
      generation,
    ).query({
      ...request,
      mode: "hybrid-graph",
      graph: { enabled: true, max_depth: 1, predicates: [] },
    });
    expect(empty.result_count).toBe(0);
    expect(forConcepts.mock.calls).toHaveLength(1);
    expect(forConcepts).toHaveBeenCalledWith(
      generation.generation_id,
      [],
      request.filters,
      request.candidate_k,
    );
    expect(empty.diagnostics[0]?.code).toBe("RETRIEVAL_QUERY_EMPTY");
  });

  it("does not impose lexical overlap on other semantic providers or lexical results", async () => {
    const unit = retrievalUnit({ retrieval_text: "Synthetic orchard.", unit_id: "ru:semantic" });
    const rows = [{ unit, score: 0.9, rank: 1 }];
    const semantic: EmbeddingProvider = {
      provider: "synthetic-semantic",
      model: "fixture",
      dimension: provider.dimension,
      contractFingerprint: "sha256:fixture",
      allowedDataClassifications: ["public"],
      embedQuery: (text) => provider.embedQuery(text),
      embedDocuments: (texts) => provider.embedDocuments(texts),
    };
    const store: RetrievalStore = {
      lexical: async () => rows,
      vector: async () => rows,
      forConcepts: async () => [],
    };
    const request = parseRetrievalRequest({ text: "unrelated", mode: "vector" });
    expect(
      (await new RetrievalEngine(store, semantic, graph, generation).query(request)).result_count,
    ).toBe(1);
    const hybrid = await new RetrievalEngine(store, provider, graph, generation).query({
      ...request,
      mode: "hybrid",
    });
    expect(hybrid.result_count).toBe(1);
    expect(hybrid.results[0]?.vector_rank).toBeNull();
    expect(hybrid.results[0]?.lexical_rank).toBe(1);
    expect(hybrid.selection_decisions).toEqual([
      { unit_id: unit.unit_id, selected: true, reason: "selected" },
    ]);
  });

  it.each([
    ["a a a how should", "a a a an orchard", false],
    ["quantum", "or", false],
    ["not quantum", "not orchard", false],
    ["error-correction", "AKL-000070", false],
    ["API latency", "A synthetic API contract", true],
    ["AKL-000070", "Claim akl-000070", true],
    ["AKL-000070", "Claim AKL-0000700", false],
    ["CAFÉ", "synthetic café", true],
    ["容量", "容量", true],
    ["", "synthetic", false],
    ["?!", "?!", false],
    ["synthetic", "", false],
  ])("checks unhashed whole tokens: %s / %s", (query, candidate, expected) => {
    expect(fakeEmbeddingHasTokenOverlap(query, candidate)).toBe(expected);
  });
});
