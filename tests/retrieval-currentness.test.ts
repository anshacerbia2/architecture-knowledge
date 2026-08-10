import { createHash } from "node:crypto";

import { beforeAll, describe, expect, it, vi } from "vitest";

import { DeterministicFakeEmbeddingProvider } from "../src/embedding-provider.js";
import { buildGraphArtifacts } from "../src/graph-projector.js";
import { serializeGraphValue } from "../src/graph-projector.js";
import { loadRepository } from "../src/model.js";
import type { RetrievalDatabase } from "../src/retrieval-database.js";
import {
  RETRIEVAL_CHUNKING_VERSION,
  RETRIEVAL_NORMALIZATION_VERSION,
  RETRIEVAL_TOOL_VERSION,
} from "../src/retrieval-config.js";
import {
  checkRetrievalCurrent,
  databaseManifestRoot,
  generationId,
  type GenerationRecord,
} from "../src/retrieval-indexer.js";
import { buildRetrievalArtifacts } from "../src/retrieval-units.js";
import type { RetrievalArtifacts } from "../src/retrieval-types.js";

describe("M5 generation identity and database manifest", () => {
  let artifacts: RetrievalArtifacts;
  const provider = new DeterministicFakeEmbeddingProvider();

  beforeAll(async () => {
    artifacts = buildRetrievalArtifacts(buildGraphArtifacts(await loadRepository(process.cwd())));
  });

  it("changes generation identity across repository and embedding contracts", () => {
    const original = generationId("commit-a", artifacts.manifest, provider);
    expect(generationId("commit-a", artifacts.manifest, provider)).toBe(original);
    expect(generationId("commit-b", artifacts.manifest, provider)).not.toBe(original);
    expect(
      generationId(
        "commit-a",
        artifacts.manifest,
        new DeterministicFakeEmbeddingProvider({ model: "v2" }),
      ),
    ).not.toBe(original);
  });

  it("binds the row root to generation, metadata, citations, content, and vector contract", () => {
    const id = generationId("commit", artifacts.manifest, provider);
    const original = databaseManifestRoot(id, artifacts.units, provider);
    expect(databaseManifestRoot(id, artifacts.units, provider)).toBe(original);
    expect(databaseManifestRoot(id + "-other", artifacts.units, provider)).not.toBe(original);
    const changedMetadata = structuredClone(artifacts.units);
    changedMetadata[0]!.metadata.status = "tampered";
    expect(databaseManifestRoot(id, changedMetadata, provider)).not.toBe(original);
    const changedCitation = structuredClone(artifacts.units);
    changedCitation[0]!.citations = [];
    expect(databaseManifestRoot(id, changedCitation, provider)).not.toBe(original);
    const changedContent = structuredClone(artifacts.units);
    changedContent[0]!.content_hash = "sha256:tampered";
    expect(databaseManifestRoot(id, changedContent, provider)).not.toBe(original);
  });

  it("fails closed for every active-generation contract mismatch and row-root tampering", async () => {
    const commit = "commit";
    const id = generationId(commit, artifacts.manifest, provider);
    const root = databaseManifestRoot(id, artifacts.units, provider);
    const generation: GenerationRecord = {
      generation_id: id,
      repository_commit: commit,
      graph_input_fingerprint: artifacts.manifest.graph_input_fingerprint,
      retrieval_manifest_root: artifacts.manifest.manifest_root_hash,
      retrieval_unit_contract_version: artifacts.manifest.retrieval_unit_contract_version,
      embedding_provider: provider.provider,
      embedding_model: provider.model,
      embedding_dimension: provider.dimension,
      embedding_contract_fingerprint: provider.contractFingerprint,
      normalization_version: RETRIEVAL_NORMALIZATION_VERSION,
      chunking_version: RETRIEVAL_CHUNKING_VERSION,
      created_by_tool_version: RETRIEVAL_TOOL_VERSION,
      status: "active",
      unit_count: artifacts.units.length,
      manifest_hash: root,
    };
    const rows = artifacts.units.map((unit) => ({
      unit_id: unit.unit_id,
      content_hash: unit.content_hash,
      metadata_hash: digest(serializeGraphValue(unit.metadata)),
      citation_hash: digest(serializeGraphValue(unit.citations)),
      embedding_present: true,
      vector_dimension: provider.dimension,
    }));
    const databaseFor = (active: GenerationRecord, databaseRows = rows) =>
      ({
        pool: {
          query: vi
            .fn()
            .mockResolvedValueOnce({ rows: [active], rowCount: 1 })
            .mockResolvedValueOnce({ rows: databaseRows, rowCount: databaseRows.length }),
        },
      }) as unknown as RetrievalDatabase;

    await expect(
      checkRetrievalCurrent(databaseFor(generation), artifacts, provider, commit),
    ).resolves.toMatchObject({ generation_id: id });
    const missingDatabase = {
      pool: { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) },
    } as unknown as RetrievalDatabase;
    await expect(
      checkRetrievalCurrent(missingDatabase, artifacts, provider, commit),
    ).rejects.toThrow("RETRIEVAL_GENERATION_MISSING");
    for (const [field, value] of [
      ["repository_commit", "other"],
      ["graph_input_fingerprint", "sha256:other"],
      ["retrieval_manifest_root", "sha256:other"],
      ["embedding_provider", "other"],
      ["embedding_model", "other"],
      ["embedding_dimension", 1],
      ["embedding_contract_fingerprint", "sha256:other"],
      ["normalization_version", "other"],
      ["chunking_version", "other"],
      ["unit_count", artifacts.units.length - 1],
    ] as const) {
      const changed = { ...generation, [field]: value } as GenerationRecord;
      await expect(
        checkRetrievalCurrent(databaseFor(changed), artifacts, provider, commit),
      ).rejects.toThrow(String(field));
    }
    const tamperedRows = structuredClone(rows);
    tamperedRows[0]!.embedding_present = false;
    await expect(
      checkRetrievalCurrent(databaseFor(generation, tamperedRows), artifacts, provider, commit),
    ).rejects.toThrow("database_manifest_root");
    await expect(
      checkRetrievalCurrent(
        databaseFor({ ...generation, manifest_hash: "sha256:tampered" }),
        artifacts,
        provider,
        commit,
      ),
    ).rejects.toThrow("database_manifest_root");
    await expect(
      checkRetrievalCurrent(
        databaseFor(generation),
        artifacts,
        new DeterministicFakeEmbeddingProvider({ dimension: 8 }),
        commit,
      ),
    ).rejects.toThrow("RETRIEVAL_EMBEDDING_DIMENSION");
  });
});

function digest(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
