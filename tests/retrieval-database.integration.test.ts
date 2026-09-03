import { describe, expect, it } from "vitest";

import { DeterministicFakeEmbeddingProvider } from "../src/embedding-provider.js";
import { expectedRetrievalArtifacts } from "../src/retrieval-artifacts.js";
import { RetrievalDatabase } from "../src/retrieval-database.js";
import {
  checkRetrievalCurrent,
  indexRetrievalGeneration,
  repositoryCommit,
} from "../src/retrieval-indexer.js";
import { PostgresRetrievalStore } from "../src/retrieval-query.js";

const connectionString = process.env.RETRIEVAL_DATABASE_URL;

describe.runIf(Boolean(connectionString))("M5 PostgreSQL and pgvector integration", () => {
  it("migrates repeatedly with extension, constraints, and indexes", async () => {
    const database = new RetrievalDatabase({ connectionString: connectionString! });
    try {
      expect([
        [],
        ["0002_decision_guide_retrieval.sql"],
        ["0001_retrieval.sql", "0002_decision_guide_retrieval.sql"],
      ]).toContainEqual(await database.migrate(process.cwd()));
      expect(await database.migrate(process.cwd())).toEqual([]);
      const extension = await database.pool.query(
        "SELECT extversion FROM pg_extension WHERE extname='vector'",
      );
      expect(extension.rowCount).toBe(1);
      const indexes = await database.pool.query<{ indexname: string }>(
        "SELECT indexname FROM pg_indexes WHERE tablename='retrieval_units'",
      );
      expect(indexes.rows.map((row) => row.indexname)).toContain("retrieval_units_search_gin");
      const unitKindConstraint = await database.pool.query<{ definition: string }>(
        "SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conname='retrieval_units_unit_kind_check'",
      );
      expect(unitKindConstraint.rows[0]?.definition).toContain("decision-guide-overview");
      expect(unitKindConstraint.rows[0]?.definition).toContain("decision-guide-section");
    } finally {
      await database.close();
    }
  });

  it("builds, queries, and verifies a complete active generation", async () => {
    const database = new RetrievalDatabase({ connectionString: connectionString! });
    const provider = new DeterministicFakeEmbeddingProvider();
    try {
      const artifacts = await expectedRetrievalArtifacts(process.cwd());
      const commit = await repositoryCommit(process.cwd());
      const generation = await indexRetrievalGeneration(database, artifacts, provider, commit);
      expect(generation).toMatchObject({ status: "active", unit_count: artifacts.units.length });
      expect(
        (await checkRetrievalCurrent(database, artifacts, provider, commit)).generation_id,
      ).toBe(generation.generation_id);
      const store = new PostgresRetrievalStore(database.pool);
      expect(
        (await store.lexical(generation.generation_id, "AKC-000014", emptyFilters(), 5))[0]?.unit
          .record_id,
      ).toBe("AKC-000014");
      const queryVector = await provider.embedQuery("OIDC issuer validation");
      expect(
        (await store.vector(generation.generation_id, queryVector, emptyFilters(), 5)).length,
      ).toBeGreaterThan(0);
    } finally {
      await database.close();
    }
  }, 120_000);

  it("keeps the active generation when malformed embeddings fail", async () => {
    const database = new RetrievalDatabase({ connectionString: connectionString! });
    try {
      const artifacts = await expectedRetrievalArtifacts(process.cwd());
      const commit = await repositoryCommit(process.cwd());
      const active = await checkRetrievalCurrent(
        database,
        artifacts,
        new DeterministicFakeEmbeddingProvider(),
        commit,
      );
      const malformed = new DeterministicFakeEmbeddingProvider({
        model: "malformed-v1",
        malformed: "short",
      });
      await expect(
        indexRetrievalGeneration(database, artifacts, malformed, commit),
      ).rejects.toThrow("DIMENSION");
      const stillActive = await database.pool.query<{ generation_id: string }>(
        "SELECT generation_id FROM retrieval_generations WHERE status='active'",
      );
      expect(stillActive.rows[0]?.generation_id).toBe(active.generation_id);
    } finally {
      await database.close();
    }
  }, 120_000);

  it("detects row and generation tampering", async () => {
    const database = new RetrievalDatabase({ connectionString: connectionString! });
    const provider = new DeterministicFakeEmbeddingProvider();
    try {
      const artifacts = await expectedRetrievalArtifacts(process.cwd());
      const commit = await repositoryCommit(process.cwd());
      const generation = await checkRetrievalCurrent(database, artifacts, provider, commit);
      const original = await database.pool.query<{ metadata_hash: string }>(
        "SELECT metadata_hash FROM retrieval_units WHERE generation_id=$1 ORDER BY unit_id LIMIT 1",
        [generation.generation_id],
      );
      await database.pool.query(
        "UPDATE retrieval_units SET metadata_hash=$2 WHERE generation_id=$1 AND unit_id=(SELECT unit_id FROM retrieval_units WHERE generation_id=$1 ORDER BY unit_id LIMIT 1)",
        [generation.generation_id, "sha256:tampered"],
      );
      await expect(checkRetrievalCurrent(database, artifacts, provider, commit)).rejects.toThrow(
        "RETRIEVAL_INDEX_NOT_CURRENT",
      );
      await database.pool.query(
        "UPDATE retrieval_units SET metadata_hash=$2 WHERE generation_id=$1 AND metadata_hash=$3",
        [generation.generation_id, original.rows[0]?.metadata_hash, "sha256:tampered"],
      );
      await database.pool.query(
        "UPDATE retrieval_generations SET unit_count=unit_count+1 WHERE generation_id=$1",
        [generation.generation_id],
      );
      await expect(checkRetrievalCurrent(database, artifacts, provider, commit)).rejects.toThrow(
        "unit_count",
      );
      await database.pool.query(
        "UPDATE retrieval_generations SET unit_count=$2 WHERE generation_id=$1",
        [generation.generation_id, artifacts.units.length],
      );
      await checkRetrievalCurrent(database, artifacts, provider, commit);
    } finally {
      await database.close();
    }
  }, 120_000);
});

function emptyFilters() {
  return {
    concept_types: [],
    domains: [],
    statuses: [],
    claim_types: [],
    semantic_scopes: [],
    minimum_confidence: null,
    normative_forces: [],
    unit_kinds: [],
  };
}
