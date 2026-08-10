import type pg from "pg";

import { asArray, asString, isPlainObject } from "./io.js";
import type { GraphArtifacts, GraphEdge } from "./graph-types.js";
import { validateEmbeddingVector } from "./embedding-provider.js";
import {
  EXACT_ID_BOOST,
  EXACT_TITLE_OR_KEY_BOOST,
  GRAPH_DISTANCE_PENALTY,
  LEXICAL_RRF_WEIGHT,
  MIN_VECTOR_SIMILARITY,
  RRF_K,
  VECTOR_RRF_WEIGHT,
} from "./retrieval-config.js";
import type { GenerationRecord } from "./retrieval-indexer.js";
import { RETRIEVAL_CONTRACT_VERSION } from "./retrieval-types.js";
import type {
  EmbeddingProvider,
  RankedRow,
  RetrievalCandidate,
  RetrievalFilters,
  RetrievalPacket,
  RetrievalRequest,
  RetrievalResult,
  RetrievalUnit,
} from "./retrieval-types.js";

export interface RetrievalStore {
  lexical(
    generationId: string,
    text: string,
    filters: RetrievalFilters,
    limit: number,
  ): Promise<RankedRow[]>;
  vector(
    generationId: string,
    vector: readonly number[],
    filters: RetrievalFilters,
    limit: number,
  ): Promise<RankedRow[]>;
  forConcepts(
    generationId: string,
    conceptIds: readonly string[],
    filters: RetrievalFilters,
    limit: number,
  ): Promise<RetrievalUnit[]>;
}

export class PostgresRetrievalStore implements RetrievalStore {
  constructor(private readonly pool: pg.Pool) {}

  async lexical(
    generationId: string,
    text: string,
    filters: RetrievalFilters,
    limit: number,
  ): Promise<RankedRow[]> {
    const query = buildFilterSql(filters, 3);
    const result = await this.pool.query<UnitRow & { channel_score: number }>(
      `SELECT ${unitColumns()}, ts_rank_cd(search_document, websearch_to_tsquery('simple', $2), 32) AS channel_score
       FROM retrieval_units WHERE generation_id=$1
       AND search_document @@ websearch_to_tsquery('simple', $2) ${query.sql}
       ORDER BY channel_score DESC, unit_id ASC LIMIT $${query.parameters.length + 3}`,
      [generationId, text, ...query.parameters, limit],
    );
    return result.rows.map((row, index) => ({
      unit: rowToUnit(row),
      rank: index + 1,
      score: Number(row.channel_score),
    }));
  }

  async vector(
    generationId: string,
    vector: readonly number[],
    filters: RetrievalFilters,
    limit: number,
  ): Promise<RankedRow[]> {
    const query = buildFilterSql(filters, 4);
    const result = await this.pool.query<UnitRow & { channel_score: number }>(
      `SELECT ${unitColumns()}, 1 - (embedding <=> $2::vector) AS channel_score
       FROM retrieval_units WHERE generation_id=$1
       AND 1 - (embedding <=> $2::vector) >= $3 ${query.sql}
       ORDER BY embedding <=> $2::vector ASC, unit_id ASC LIMIT $${query.parameters.length + 4}`,
      [generationId, vectorLiteral(vector), MIN_VECTOR_SIMILARITY, ...query.parameters, limit],
    );
    return result.rows.map((row, index) => ({
      unit: rowToUnit(row),
      rank: index + 1,
      score: Number(row.channel_score),
    }));
  }

  async forConcepts(
    generationId: string,
    conceptIds: readonly string[],
    filters: RetrievalFilters,
    limit: number,
  ): Promise<RetrievalUnit[]> {
    if (conceptIds.length === 0) return [];
    const query = buildFilterSql(filters, 3);
    const result = await this.pool.query<UnitRow>(
      `SELECT ${unitColumns()} FROM retrieval_units WHERE generation_id=$1
       AND concept_id = ANY($2::text[]) ${query.sql}
       ORDER BY unit_id ASC LIMIT $${query.parameters.length + 3}`,
      [generationId, conceptIds, ...query.parameters, limit],
    );
    return result.rows.map(rowToUnit);
  }
}

export class RetrievalEngine {
  constructor(
    private readonly store: RetrievalStore,
    private readonly provider: EmbeddingProvider,
    private readonly graph: GraphArtifacts,
    private readonly generation: GenerationRecord,
  ) {}

  async query(request: RetrievalRequest): Promise<RetrievalPacket> {
    const needsLexical = request.mode !== "vector";
    const needsVector = request.mode !== "lexical";
    const lexical = needsLexical
      ? await this.store.lexical(
          this.generation.generation_id,
          request.text,
          request.filters,
          request.candidate_k,
        )
      : [];
    let vector: RankedRow[] = [];
    let degraded = false;
    let degradationReason: string | null = null;
    if (needsVector) {
      try {
        const queryVector = validateEmbeddingVector(
          await this.provider.embedQuery(request.text),
          this.provider.dimension,
        );
        vector = await this.store.vector(
          this.generation.generation_id,
          queryVector,
          request.filters,
          request.candidate_k,
        );
      } catch (error) {
        if (!request.allow_degraded_lexical_fallback || !needsLexical) throw error;
        degraded = true;
        degradationReason = stableErrorCode(error);
      }
    }
    const fused = fuseCandidates(request.text, lexical, vector);
    const expanded =
      request.mode === "hybrid-graph" && request.graph.enabled && request.graph.max_depth > 0
        ? await expandCandidates(
            fused,
            this.graph,
            request,
            this.store,
            this.generation.generation_id,
          )
        : fused;
    const selected = applyBudget(rerankCandidates(request.text, expanded), request);
    const results = selected.results.slice(0, request.top_k);
    return {
      retrieval_contract_version: RETRIEVAL_CONTRACT_VERSION,
      query: request,
      generation: {
        generation_id: this.generation.generation_id,
        graph_input_fingerprint: this.generation.graph_input_fingerprint,
        retrieval_manifest_root: this.generation.retrieval_manifest_root,
        embedding_provider: this.generation.embedding_provider,
        embedding_model: this.generation.embedding_model,
        embedding_dimension: this.generation.embedding_dimension,
      },
      result_count: results.length,
      estimated_tokens: results.reduce((sum, result) => sum + result.unit.estimated_tokens, 0),
      degraded,
      degradation_reason: degradationReason,
      results,
      selection_decisions: selected.decisions,
      diagnostics:
        results.length === 0
          ? [{ code: "RETRIEVAL_QUERY_EMPTY", message: "No governed retrieval unit matched." }]
          : [],
    };
  }
}

export function fuseCandidates(
  queryText: string,
  lexical: RankedRow[],
  vector: RankedRow[],
): RetrievalCandidate[] {
  const byId = new Map<string, RetrievalCandidate>();
  for (const row of lexical) {
    byId.set(row.unit.unit_id, {
      unit: row.unit,
      lexical_rank: row.rank,
      lexical_score: row.score,
      vector_rank: null,
      vector_similarity: null,
      graph_distance: null,
      graph_path: [],
      graph_relationship_ids: [],
    });
  }
  for (const row of vector) {
    const existing = byId.get(row.unit.unit_id);
    if (existing) {
      existing.vector_rank = row.rank;
      existing.vector_similarity = row.score;
    } else {
      byId.set(row.unit.unit_id, {
        unit: row.unit,
        lexical_rank: null,
        lexical_score: null,
        vector_rank: row.rank,
        vector_similarity: row.score,
        graph_distance: null,
        graph_path: [],
        graph_relationship_ids: [],
      });
    }
  }
  return [...byId.values()].sort(
    (left, right) =>
      baseScore(queryText, right) - baseScore(queryText, left) ||
      left.unit.unit_id.localeCompare(right.unit.unit_id),
  );
}

export function rerankCandidates(
  queryText: string,
  candidates: RetrievalCandidate[],
): RetrievalResult[] {
  return candidates
    .map((candidate) => {
      const exact = exactBoost(queryText, candidate.unit);
      const lexicalRrf =
        candidate.lexical_rank === null ? 0 : LEXICAL_RRF_WEIGHT / (RRF_K + candidate.lexical_rank);
      const vectorRrf =
        candidate.vector_rank === null ? 0 : VECTOR_RRF_WEIGHT / (RRF_K + candidate.vector_rank);
      const graphPenalty =
        candidate.graph_distance === null ? 0 : candidate.graph_distance * GRAPH_DISTANCE_PENALTY;
      return {
        ...candidate,
        score: lexicalRrf + vectorRrf + exact - graphPenalty,
        score_breakdown: {
          lexical_rrf: lexicalRrf,
          vector_rrf: vectorRrf,
          exact_match_boost: exact,
          graph_penalty: graphPenalty,
        },
        selection: { selected: false, reason: "not-evaluated" },
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score || left.unit.unit_id.localeCompare(right.unit.unit_id),
    );
}

export function applyBudget(
  ranked: RetrievalResult[],
  request: RetrievalRequest,
): {
  results: RetrievalResult[];
  decisions: Array<{ unit_id: string; selected: boolean; reason: string }>;
} {
  const results: RetrievalResult[] = [];
  const decisions: Array<{ unit_id: string; selected: boolean; reason: string }> = [];
  const conceptCounts = new Map<string, number>();
  let tokens = 0;
  for (const result of ranked) {
    let reason = "selected";
    if (results.length >= request.budget.max_units) reason = "max-units";
    else if (tokens + result.unit.estimated_tokens > request.budget.max_estimated_tokens)
      reason = "token-budget";
    else if (
      result.unit.concept_id &&
      (conceptCounts.get(result.unit.concept_id) ?? 0) >= request.budget.max_units_per_concept
    )
      reason = "concept-diversity";
    const selected = reason === "selected";
    decisions.push({ unit_id: result.unit.unit_id, selected, reason });
    if (!selected) continue;
    result.selection = { selected: true, reason };
    results.push(result);
    tokens += result.unit.estimated_tokens;
    if (result.unit.concept_id)
      conceptCounts.set(
        result.unit.concept_id,
        (conceptCounts.get(result.unit.concept_id) ?? 0) + 1,
      );
  }
  return { results, decisions };
}

async function expandCandidates(
  seeds: RetrievalCandidate[],
  graph: GraphArtifacts,
  request: RetrievalRequest,
  store: RetrievalStore,
  generationId: string,
): Promise<RetrievalCandidate[]> {
  const seedConcepts = [
    ...new Set(seeds.map((seed) => seed.unit.concept_id).filter((id): id is string => id !== null)),
  ];
  const paths = graphExpansionPaths(
    graph,
    seedConcepts,
    request.graph.max_depth,
    request.graph.predicates,
  );
  const expandedUnits = await store.forConcepts(
    generationId,
    [...paths.keys()].sort(),
    request.filters,
    request.candidate_k,
  );
  const byId = new Map(seeds.map((seed) => [seed.unit.unit_id, seed]));
  for (const unit of expandedUnits) {
    if (byId.has(unit.unit_id) || !unit.concept_id) continue;
    const path = paths.get(unit.concept_id);
    if (!path) continue;
    byId.set(unit.unit_id, {
      unit,
      lexical_rank: null,
      lexical_score: null,
      vector_rank: null,
      vector_similarity: null,
      graph_distance: path.nodeIds.length - 1,
      graph_path: path.nodeIds,
      graph_relationship_ids: path.relationshipIds,
    });
  }
  return [...byId.values()];
}

export function graphExpansionPaths(
  graph: GraphArtifacts,
  seeds: string[],
  maxDepth: number,
  predicates: string[],
): Map<string, { nodeIds: string[]; relationshipIds: string[] }> {
  if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 2)
    throw new Error("RETRIEVAL_GRAPH_DEPTH_INVALID");
  const permitted = new Set(predicates);
  const edges = graph.edges
    .filter(
      (edge) =>
        edge.family === "relationship" &&
        edge.traversable &&
        edge.relationship_id !== "AKR-000010" &&
        (permitted.size === 0 || permitted.has(edge.predicate)),
    )
    .sort(compareEdges);
  const result = new Map<string, { nodeIds: string[]; relationshipIds: string[] }>();
  const queue = [...seeds]
    .sort()
    .map((seed) => ({ nodeIds: [seed], relationshipIds: [] as string[] }));
  while (queue.length > 0) {
    const state = queue.shift();
    if (!state || state.relationshipIds.length >= maxDepth) continue;
    const current = state.nodeIds[state.nodeIds.length - 1];
    for (const edge of edges) {
      const next = adjacentConcept(edge, current);
      if (!next || state.nodeIds.includes(next) || !edge.relationship_id) continue;
      const path = {
        nodeIds: [...state.nodeIds, next],
        relationshipIds: [...state.relationshipIds, edge.relationship_id],
      };
      const previous = result.get(next);
      if (!previous || path.relationshipIds.length < previous.relationshipIds.length)
        result.set(next, path);
      queue.push(path);
    }
  }
  for (const seed of seeds) result.delete(seed);
  return result;
}

interface UnitRow {
  unit_id: string;
  unit_kind: RetrievalUnit["unit_kind"];
  record_id: string;
  concept_id: string | null;
  section_key: string;
  ordinal: number;
  title: string;
  retrieval_text: string;
  content_hash: string;
  estimated_tokens: number;
  metadata: unknown;
  source_path: string;
  lifecycle_status: string | null;
  semantic_scope: string | null;
  confidence: string | null;
  citations: unknown;
}

function rowToUnit(row: UnitRow): RetrievalUnit {
  if (!isPlainObject(row.metadata) || !Array.isArray(row.citations))
    throw new Error(`RETRIEVAL_DATABASE_ROW_INVALID ${row.unit_id}`);
  return {
    retrieval_unit_contract_version: 1,
    unit_id: row.unit_id,
    unit_kind: row.unit_kind,
    record_id: row.record_id,
    concept_id: row.concept_id,
    section_key: row.section_key,
    ordinal: row.ordinal,
    title: row.title,
    retrieval_text: row.retrieval_text,
    content_hash: row.content_hash,
    estimated_tokens: row.estimated_tokens,
    metadata: row.metadata,
    source_path: row.source_path,
    lifecycle_status: row.lifecycle_status,
    semantic_scope: row.semantic_scope,
    confidence: row.confidence,
    citations: row.citations as RetrievalUnit["citations"],
  };
}

function buildFilterSql(
  filters: RetrievalFilters,
  firstParameter: number,
): { sql: string; parameters: unknown[] } {
  const conditions: string[] = [];
  const parameters: unknown[] = [];
  const addArray = (column: string, values: string[]): void => {
    if (values.length === 0) return;
    conditions.push(`${column} = ANY($${firstParameter + parameters.length}::text[])`);
    parameters.push(values);
  };
  addArray("metadata->>'concept_type'", filters.concept_types);
  addArray("metadata->>'domain'", filters.domains);
  addArray("lifecycle_status", filters.statuses);
  addArray("metadata->>'claim_type'", filters.claim_types);
  addArray("semantic_scope", filters.semantic_scopes);
  addArray("metadata->>'normative_force'", filters.normative_forces);
  addArray("unit_kind", filters.unit_kinds);
  if (filters.minimum_confidence) {
    const threshold = { low: 1, medium: 2, high: 3 }[filters.minimum_confidence];
    conditions.push(
      `(CASE confidence WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 ELSE 0 END) >= $${firstParameter + parameters.length}`,
    );
    parameters.push(threshold);
  }
  return { sql: conditions.map((condition) => `AND ${condition}`).join(" "), parameters };
}

function unitColumns(): string {
  return [
    "unit_id",
    "unit_kind",
    "record_id",
    "concept_id",
    "section_key",
    "ordinal",
    "title",
    "retrieval_text",
    "content_hash",
    "estimated_tokens",
    "metadata",
    "source_path",
    "lifecycle_status",
    "semantic_scope",
    "confidence",
    "citations",
  ].join(", ");
}

function vectorLiteral(vector: readonly number[]): string {
  if (vector.some((value) => !Number.isFinite(value)))
    throw new Error("RETRIEVAL_EMBEDDING_NONFINITE");
  return `[${vector.join(",")}]`;
}

function baseScore(queryText: string, candidate: RetrievalCandidate): number {
  const lexical =
    candidate.lexical_rank === null ? 0 : LEXICAL_RRF_WEIGHT / (RRF_K + candidate.lexical_rank);
  const vector =
    candidate.vector_rank === null ? 0 : VECTOR_RRF_WEIGHT / (RRF_K + candidate.vector_rank);
  return lexical + vector + exactBoost(queryText, candidate.unit);
}

function exactBoost(queryText: string, unit: RetrievalUnit): number {
  const query = queryText.trim().toLocaleLowerCase("en-US");
  if (query === unit.record_id.toLocaleLowerCase("en-US")) return EXACT_ID_BOOST;
  const exactTerms = [
    unit.title,
    asString(unit.metadata.title),
    asString(unit.metadata.human_key),
    ...asArray(unit.metadata.aliases).filter((value): value is string => typeof value === "string"),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLocaleLowerCase("en-US"));
  return exactTerms.includes(query) ? EXACT_TITLE_OR_KEY_BOOST : 0;
}

function adjacentConcept(edge: GraphEdge, current: string | undefined): string | undefined {
  if (!current) return undefined;
  if (edge.direction === "symmetric") {
    if (edge.from === current) return edge.to;
    if (edge.to === current) return edge.from;
    return undefined;
  }
  return edge.from === current ? edge.to : undefined;
}

function compareEdges(left: GraphEdge, right: GraphEdge): number {
  return (
    left.from.localeCompare(right.from) ||
    left.to.localeCompare(right.to) ||
    left.id.localeCompare(right.id)
  );
}

function stableErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.match(/^([A-Z][A-Z0-9_]+)/)?.[1] ?? "RETRIEVAL_VECTOR_UNAVAILABLE";
}
