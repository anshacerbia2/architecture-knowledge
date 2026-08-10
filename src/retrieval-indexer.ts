import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";

import type pg from "pg";

import { validateEmbeddingVector } from "./embedding-provider.js";
import { serializeGraphValue } from "./graph-projector.js";
import {
  RETRIEVAL_CHUNKING_VERSION,
  RETRIEVAL_NORMALIZATION_VERSION,
  RETRIEVAL_TOOL_VERSION,
} from "./retrieval-config.js";
import { databaseError, RetrievalDatabase } from "./retrieval-database.js";
import type {
  EmbeddingProvider,
  RetrievalArtifacts,
  RetrievalManifest,
  RetrievalUnit,
} from "./retrieval-types.js";

const execFileAsync = promisify(execFile);

export interface GenerationRecord {
  generation_id: string;
  repository_commit: string;
  graph_input_fingerprint: string;
  retrieval_manifest_root: string;
  retrieval_unit_contract_version: number;
  embedding_provider: string;
  embedding_model: string;
  embedding_dimension: number;
  embedding_contract_fingerprint: string;
  normalization_version: string;
  chunking_version: string;
  created_by_tool_version: string;
  status: string;
  unit_count: number;
  manifest_hash: string | null;
}

export interface RetrievalIndexPerformance {
  index_build_duration_ms: number;
  embedding_provider_duration_ms: number;
  embedding_requested_count: number;
  embedding_cache_hit_count: number;
  reused_active_generation: boolean;
}

export async function repositoryCommit(root: string): Promise<string> {
  const result = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: root });
  return result.stdout.trim();
}

export function generationId(
  repositoryCommitValue: string,
  manifest: RetrievalManifest,
  provider: EmbeddingProvider,
): string {
  return `rg:${digest(
    [
      repositoryCommitValue,
      manifest.graph_input_fingerprint,
      manifest.manifest_root_hash,
      provider.contractFingerprint,
    ].join("\n"),
  ).slice(0, 32)}`;
}

export async function indexRetrievalGeneration(
  database: RetrievalDatabase,
  artifacts: RetrievalArtifacts,
  provider: EmbeddingProvider,
  repositoryCommitValue: string,
  metrics?: RetrievalIndexPerformance,
): Promise<GenerationRecord> {
  const indexStarted = performance.now();
  initializeMetrics(metrics);
  enforceProviderContract(provider);
  const id = generationId(repositoryCommitValue, artifacts.manifest, provider);
  const existing = await database.pool.query<GenerationRecord>(
    "SELECT * FROM retrieval_generations WHERE generation_id = $1",
    [id],
  );
  if (existing.rows[0]?.status === "active") {
    await checkRetrievalCurrent(database, artifacts, provider, repositoryCommitValue);
    if (metrics) {
      metrics.reused_active_generation = true;
      metrics.index_build_duration_ms = elapsed(indexStarted);
    }
    return existing.rows[0];
  }
  await database.pool.query(
    `INSERT INTO retrieval_generations (
      generation_id, repository_commit, graph_input_fingerprint, retrieval_manifest_root,
      retrieval_unit_contract_version, embedding_provider, embedding_model, embedding_dimension,
      embedding_contract_fingerprint, normalization_version, chunking_version,
      created_by_tool_version, status, unit_count, manifest_hash, failure_code
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'building',$13,NULL,NULL)
    ON CONFLICT (generation_id) DO UPDATE SET status='building', failure_code=NULL, manifest_hash=NULL`,
    generationParameters(id, repositoryCommitValue, artifacts, provider),
  );

  try {
    const vectors = await obtainEmbeddings(database, artifacts.units, provider, metrics);
    const expectedRoot = databaseManifestRoot(id, artifacts.units, provider);
    const client = await database.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM retrieval_units WHERE generation_id = $1", [id]);
      for (const [index, unit] of artifacts.units.entries()) {
        const vector = vectors[index];
        if (!vector) throw new Error(`RETRIEVAL_EMBEDDING_MISSING ${unit.unit_id}`);
        await insertUnit(client, id, unit, vector);
      }
      const count = await client.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM retrieval_units WHERE generation_id = $1",
        [id],
      );
      if (Number(count.rows[0]?.count) !== artifacts.units.length) {
        throw new Error("RETRIEVAL_GENERATION_INCOMPLETE");
      }
      const actualRoot = await computeDatabaseManifestRoot(client, id, provider);
      if (actualRoot !== expectedRoot) throw new Error("RETRIEVAL_DATABASE_MANIFEST_MISMATCH");
      await client.query(
        "UPDATE retrieval_generations SET status='ready', manifest_hash=$2 WHERE generation_id=$1",
        [id, actualRoot],
      );
      await client.query(
        "UPDATE retrieval_generations SET status='superseded' WHERE status='active' AND generation_id <> $1",
        [id],
      );
      await client.query(
        "UPDATE retrieval_generations SET status='active' WHERE generation_id=$1 AND status='ready'",
        [id],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    await database.pool.query(
      "UPDATE retrieval_generations SET status='failed', failure_code=$2 WHERE generation_id=$1 AND status <> 'active'",
      [id, stableFailureCode(error)],
    );
    if (error instanceof Error && error.message.startsWith("RETRIEVAL_")) throw error;
    throw databaseError(error, "RETRIEVAL_INDEX_FAILED");
  }
  const result = await database.pool.query<GenerationRecord>(
    "SELECT * FROM retrieval_generations WHERE generation_id = $1",
    [id],
  );
  const generation = result.rows[0];
  if (!generation) throw new Error("RETRIEVAL_GENERATION_MISSING");
  if (metrics) metrics.index_build_duration_ms = elapsed(indexStarted);
  return generation;
}

export async function checkRetrievalCurrent(
  database: RetrievalDatabase,
  artifacts: RetrievalArtifacts,
  provider: EmbeddingProvider,
  repositoryCommitValue: string,
): Promise<GenerationRecord> {
  enforceProviderContract(provider);
  const result = await database.pool.query<GenerationRecord>(
    "SELECT * FROM retrieval_generations WHERE status = 'active'",
  );
  const generation = result.rows[0];
  if (!generation) throw new Error("RETRIEVAL_GENERATION_MISSING");
  const mismatches: string[] = [];
  if (generation.repository_commit !== repositoryCommitValue) mismatches.push("repository_commit");
  if (generation.graph_input_fingerprint !== artifacts.manifest.graph_input_fingerprint)
    mismatches.push("graph_input_fingerprint");
  if (generation.retrieval_manifest_root !== artifacts.manifest.manifest_root_hash)
    mismatches.push("retrieval_manifest_root");
  if (generation.embedding_provider !== provider.provider) mismatches.push("embedding_provider");
  if (generation.embedding_model !== provider.model) mismatches.push("embedding_model");
  if (generation.embedding_dimension !== provider.dimension) mismatches.push("embedding_dimension");
  if (generation.embedding_contract_fingerprint !== provider.contractFingerprint)
    mismatches.push("embedding_contract_fingerprint");
  if (generation.normalization_version !== RETRIEVAL_NORMALIZATION_VERSION)
    mismatches.push("normalization_version");
  if (generation.chunking_version !== RETRIEVAL_CHUNKING_VERSION)
    mismatches.push("chunking_version");
  if (generation.unit_count !== artifacts.units.length) mismatches.push("unit_count");
  const root = await computeDatabaseManifestRoot(database.pool, generation.generation_id, provider);
  const expected = databaseManifestRoot(generation.generation_id, artifacts.units, provider);
  if (generation.manifest_hash !== root || root !== expected)
    mismatches.push("database_manifest_root");
  if (mismatches.length > 0) {
    throw new Error(`RETRIEVAL_INDEX_NOT_CURRENT ${mismatches.sort().join(",")}`);
  }
  return generation;
}

async function obtainEmbeddings(
  database: RetrievalDatabase,
  units: RetrievalUnit[],
  provider: EmbeddingProvider,
  metrics?: RetrievalIndexPerformance,
): Promise<number[][]> {
  const output: Array<number[] | undefined> = Array.from({ length: units.length });
  const missingIndexes: number[] = [];
  for (const [index, unit] of units.entries()) {
    const cached = await database.pool.query<{ embedding: string }>(
      `SELECT embedding::text FROM retrieval_embedding_cache
       WHERE content_hash=$1 AND embedding_provider=$2 AND embedding_model=$3
         AND embedding_dimension=$4 AND embedding_contract_fingerprint=$5
         AND normalization_version=$6`,
      [
        unit.content_hash,
        provider.provider,
        provider.model,
        provider.dimension,
        provider.contractFingerprint,
        RETRIEVAL_NORMALIZATION_VERSION,
      ],
    );
    const value = cached.rows[0]?.embedding;
    if (value) {
      output[index] = parseVector(value, provider.dimension);
      if (metrics) metrics.embedding_cache_hit_count += 1;
    } else missingIndexes.push(index);
  }
  if (missingIndexes.length > 0) {
    const texts = missingIndexes.map((index) => units[index]?.retrieval_text ?? "");
    const providerStarted = performance.now();
    const embedded = await provider.embedDocuments(texts);
    if (metrics) {
      metrics.embedding_provider_duration_ms += elapsed(providerStarted);
      metrics.embedding_requested_count += texts.length;
    }
    if (embedded.length !== texts.length) throw new Error("RETRIEVAL_EMBEDDING_COUNT");
    for (const [offset, index] of missingIndexes.entries()) {
      const unit = units[index];
      const candidate = embedded[offset];
      if (!unit || !candidate) throw new Error("RETRIEVAL_EMBEDDING_MISSING");
      const vector = validateEmbeddingVector(candidate, provider.dimension);
      output[index] = vector;
      await database.pool.query(
        `INSERT INTO retrieval_embedding_cache (
          content_hash, embedding_provider, embedding_model, embedding_dimension,
          embedding_contract_fingerprint, normalization_version, embedding
        ) VALUES ($1,$2,$3,$4,$5,$6,$7::vector)
        ON CONFLICT DO NOTHING`,
        [
          unit.content_hash,
          provider.provider,
          provider.model,
          provider.dimension,
          provider.contractFingerprint,
          RETRIEVAL_NORMALIZATION_VERSION,
          vectorLiteral(vector),
        ],
      );
    }
  }
  return output.map((vector) => {
    if (!vector) throw new Error("RETRIEVAL_EMBEDDING_MISSING");
    return vector;
  });
}

function initializeMetrics(metrics: RetrievalIndexPerformance | undefined): void {
  if (!metrics) return;
  metrics.index_build_duration_ms = 0;
  metrics.embedding_provider_duration_ms = 0;
  metrics.embedding_requested_count = 0;
  metrics.embedding_cache_hit_count = 0;
  metrics.reused_active_generation = false;
}

function elapsed(started: number): number {
  return Math.round((performance.now() - started) * 1_000) / 1_000;
}

async function insertUnit(
  client: pg.PoolClient,
  generationIdValue: string,
  unit: RetrievalUnit,
  vector: number[],
): Promise<void> {
  const identity = [
    unit.record_id,
    unit.title,
    stringMetadata(unit.metadata, "human_key"),
    ...stringArrayMetadata(unit.metadata, "aliases"),
  ].join(" ");
  const summary = [unit.title, unit.retrieval_text.split("\n").slice(0, 3).join(" ")].join(" ");
  const auxiliary = [
    unit.unit_kind,
    stringMetadata(unit.metadata, "concept_type"),
    stringMetadata(unit.metadata, "domain"),
    ...stringArrayMetadata(unit.metadata, "tags"),
  ].join(" ");
  await client.query(
    `INSERT INTO retrieval_units (
      generation_id, unit_id, unit_kind, record_id, concept_id, section_key, ordinal,
      title, retrieval_text, content_hash, estimated_tokens, metadata, metadata_hash,
      citations, citation_hash, source_path, lifecycle_status, semantic_scope, confidence,
      lexical_identity, lexical_summary, lexical_auxiliary, embedding
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14::jsonb,$15,$16,$17,$18,$19,$20,$21,$22,$23::vector)`,
    [
      generationIdValue,
      unit.unit_id,
      unit.unit_kind,
      unit.record_id,
      unit.concept_id,
      unit.section_key,
      unit.ordinal,
      unit.title,
      unit.retrieval_text,
      unit.content_hash,
      unit.estimated_tokens,
      JSON.stringify(unit.metadata),
      objectHash(unit.metadata),
      JSON.stringify(unit.citations),
      objectHash(unit.citations),
      unit.source_path,
      unit.lifecycle_status,
      unit.semantic_scope,
      unit.confidence,
      identity,
      summary,
      auxiliary,
      vectorLiteral(vector),
    ],
  );
}

export async function computeDatabaseManifestRoot(
  queryable: Pick<pg.Pool, "query"> | pg.PoolClient,
  generationIdValue: string,
  provider: EmbeddingProvider,
): Promise<string> {
  const result = await queryable.query<{
    unit_id: string;
    content_hash: string;
    metadata_hash: string;
    citation_hash: string;
    embedding_present: boolean;
    vector_dimension: number;
  }>(
    `SELECT unit_id, content_hash, metadata_hash, citation_hash,
      (embedding IS NOT NULL) AS embedding_present, vector_dims(embedding) AS vector_dimension
     FROM retrieval_units WHERE generation_id=$1 ORDER BY unit_id`,
    [generationIdValue],
  );
  return digest(
    serializeGraphValue({
      generation_id: generationIdValue,
      embedding_contract: provider.contractFingerprint,
      rows: result.rows,
    }),
  );
}

export function databaseManifestRoot(
  generationIdValue: string,
  units: RetrievalUnit[],
  provider: EmbeddingProvider,
): string {
  return digest(
    serializeGraphValue({
      generation_id: generationIdValue,
      embedding_contract: provider.contractFingerprint,
      rows: units.map((unit) => ({
        unit_id: unit.unit_id,
        content_hash: unit.content_hash,
        metadata_hash: objectHash(unit.metadata),
        citation_hash: objectHash(unit.citations),
        embedding_present: true,
        vector_dimension: provider.dimension,
      })),
    }),
  );
}

function generationParameters(
  id: string,
  commit: string,
  artifacts: RetrievalArtifacts,
  provider: EmbeddingProvider,
): unknown[] {
  return [
    id,
    commit,
    artifacts.manifest.graph_input_fingerprint,
    artifacts.manifest.manifest_root_hash,
    artifacts.manifest.retrieval_unit_contract_version,
    provider.provider,
    provider.model,
    provider.dimension,
    provider.contractFingerprint,
    RETRIEVAL_NORMALIZATION_VERSION,
    RETRIEVAL_CHUNKING_VERSION,
    RETRIEVAL_TOOL_VERSION,
    artifacts.units.length,
  ];
}

function enforceProviderContract(provider: EmbeddingProvider): void {
  if (provider.dimension !== 1536) {
    throw new Error(`RETRIEVAL_EMBEDDING_DIMENSION expected=1536 actual=${provider.dimension}`);
  }
}

function vectorLiteral(vector: readonly number[]): string {
  if (vector.some((value) => !Number.isFinite(value))) {
    throw new Error("RETRIEVAL_EMBEDDING_NONFINITE");
  }
  return `[${vector.join(",")}]`;
}

function parseVector(value: string, dimension: number): number[] {
  if (!value.startsWith("[") || !value.endsWith("]")) throw new Error("RETRIEVAL_VECTOR_FORMAT");
  const vector = value.slice(1, -1).split(",").map(Number);
  return validateEmbeddingVector(vector, dimension);
}

function objectHash(value: unknown): string {
  return digest(serializeGraphValue(value));
}

function digest(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function stableFailureCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.match(/^([A-Z][A-Z0-9_]+)/)?.[1] ?? "RETRIEVAL_INDEX_FAILED";
}

function stringMetadata(metadata: Record<string, unknown>, key: string): string {
  return typeof metadata[key] === "string" ? metadata[key] : "";
}

function stringArrayMetadata(metadata: Record<string, unknown>, key: string): string[] {
  return Array.isArray(metadata[key])
    ? (metadata[key] as unknown[]).filter((value): value is string => typeof value === "string")
    : [];
}
