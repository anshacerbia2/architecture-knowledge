import { performance } from "node:perf_hooks";

import type { GraphArtifacts } from "./graph-types.js";
import type { GenerationRecord } from "./retrieval-indexer.js";
import { graphExpansionPaths, PostgresRetrievalStore, RetrievalEngine } from "./retrieval-query.js";
import { parseRetrievalRequest } from "./retrieval-query-contract.js";
import type { EmbeddingProvider, RetrievalMode, RetrievalRequest } from "./retrieval-types.js";
import type { RetrievalDatabase } from "./retrieval-database.js";

interface DurationSummary {
  samples: number;
  p50_ms: number;
  p95_ms: number;
}

export interface RetrievalPerformanceReport {
  evidence_class: "informational-host-performance";
  generation_id: string;
  embedding_provider: string;
  embedding_model: string;
  external_provider_latency_included: boolean;
  warmup_runs: number;
  measured_runs: number;
  inventory: {
    retrieval_unit_count: number;
    database_row_count: number;
    database_size_bytes: number;
    embedding_count: number;
    embedding_cache_count: number;
  };
  durations: {
    query_embedding: DurationSummary;
    lexical_database: DurationSummary;
    vector_database: DurationSummary;
    hybrid_database: DurationSummary;
    graph_expansion: DurationSummary;
    end_to_end_hybrid_graph: DurationSummary;
  };
}

export async function benchmarkRetrievalPerformance(
  database: RetrievalDatabase,
  store: PostgresRetrievalStore,
  provider: EmbeddingProvider,
  graph: GraphArtifacts,
  generation: GenerationRecord,
  measuredRuns = 20,
  warmupRuns = 3,
): Promise<RetrievalPerformanceReport> {
  if (!Number.isInteger(measuredRuns) || measuredRuns < 5 || measuredRuns > 100) {
    throw new Error("RETRIEVAL_PERFORMANCE_RUNS_INVALID");
  }
  const queryText = "What should I validate in an identity token?";
  const lexicalRequest = request(queryText, "lexical");
  const hybridGraphRequest = request(queryText, "hybrid-graph");
  const queryVector = await provider.embedQuery(queryText);
  const engine = new RetrievalEngine(store, provider, graph, generation);

  const runLocalChannels = async (): Promise<void> => {
    await store.lexical(generation.generation_id, queryText, lexicalRequest.filters, 40);
    await store.vector(generation.generation_id, queryVector, lexicalRequest.filters, 40);
    await Promise.all([
      store.lexical(generation.generation_id, queryText, lexicalRequest.filters, 40),
      store.vector(generation.generation_id, queryVector, lexicalRequest.filters, 40),
    ]);
    graphExpansionPaths(graph, ["AKC-000018"], 1, []);
    await engine.query(hybridGraphRequest);
  };
  for (let index = 0; index < warmupRuns; index += 1) await runLocalChannels();

  const queryEmbedding: number[] = [];
  const lexical: number[] = [];
  const vector: number[] = [];
  const hybrid: number[] = [];
  const graphExpansion: number[] = [];
  const endToEnd: number[] = [];
  for (let index = 0; index < measuredRuns; index += 1) {
    queryEmbedding.push(await duration(() => provider.embedQuery(queryText)));
    lexical.push(
      await duration(() =>
        store.lexical(generation.generation_id, queryText, lexicalRequest.filters, 40),
      ),
    );
    vector.push(
      await duration(() =>
        store.vector(generation.generation_id, queryVector, lexicalRequest.filters, 40),
      ),
    );
    hybrid.push(
      await duration(() =>
        Promise.all([
          store.lexical(generation.generation_id, queryText, lexicalRequest.filters, 40),
          store.vector(generation.generation_id, queryVector, lexicalRequest.filters, 40),
        ]),
      ),
    );
    graphExpansion.push(await duration(() => graphExpansionPaths(graph, ["AKC-000018"], 1, [])));
    endToEnd.push(await duration(() => engine.query(hybridGraphRequest)));
  }

  const inventory = await database.pool.query<{
    database_size_bytes: string;
    row_count: string;
    embedding_count: string;
    cache_count: string;
  }>(
    `SELECT pg_database_size(current_database())::text AS database_size_bytes,
      (SELECT count(*)::text FROM retrieval_units WHERE generation_id=$1) AS row_count,
      (SELECT count(embedding)::text FROM retrieval_units WHERE generation_id=$1) AS embedding_count,
      (SELECT count(*)::text FROM retrieval_embedding_cache) AS cache_count`,
    [generation.generation_id],
  );
  const row = inventory.rows[0];
  if (!row) throw new Error("RETRIEVAL_PERFORMANCE_INVENTORY_MISSING");
  return {
    evidence_class: "informational-host-performance",
    generation_id: generation.generation_id,
    embedding_provider: provider.provider,
    embedding_model: provider.model,
    external_provider_latency_included: provider.provider !== "deterministic-fake",
    warmup_runs: warmupRuns,
    measured_runs: measuredRuns,
    inventory: {
      retrieval_unit_count: generation.unit_count,
      database_row_count: Number(row.row_count),
      database_size_bytes: Number(row.database_size_bytes),
      embedding_count: Number(row.embedding_count),
      embedding_cache_count: Number(row.cache_count),
    },
    durations: {
      query_embedding: summarize(queryEmbedding),
      lexical_database: summarize(lexical),
      vector_database: summarize(vector),
      hybrid_database: summarize(hybrid),
      graph_expansion: summarize(graphExpansion),
      end_to_end_hybrid_graph: summarize(endToEnd),
    },
  };
}

function request(text: string, mode: RetrievalMode): RetrievalRequest {
  return parseRetrievalRequest({
    text,
    mode,
    top_k: 10,
    candidate_k: 40,
    graph: { enabled: mode === "hybrid-graph", max_depth: 1, predicates: [] },
  });
}

async function duration(action: () => unknown | Promise<unknown>): Promise<number> {
  const started = performance.now();
  await action();
  return round(performance.now() - started);
}

function summarize(values: number[]): DurationSummary {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    samples: sorted.length,
    p50_ms: percentile(sorted, 0.5),
    p95_ms: percentile(sorted, 0.95),
  };
}

function percentile(sorted: number[], quantile: number): number {
  const index = Math.max(0, Math.ceil(sorted.length * quantile) - 1);
  return sorted[index] ?? 0;
}

function round(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
