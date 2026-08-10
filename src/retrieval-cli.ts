import process from "node:process";

import {
  DeterministicFakeEmbeddingProvider,
  OpenAIEmbeddingProvider,
} from "./embedding-provider.js";
import { serializeGraphValue } from "./graph-projector.js";
import {
  checkRetrievalArtifacts,
  expectedRetrievalArtifacts,
  loadCurrentRetrievalArtifacts,
  loadValidatedGraph,
  writeRetrievalArtifacts,
} from "./retrieval-artifacts.js";
import { RetrievalDatabase } from "./retrieval-database.js";
import { parseRetrievalCliQuery } from "./retrieval-cli-arguments.js";
import { evaluateRetrieval, loadRetrievalGolden } from "./retrieval-evaluation.js";
import {
  checkRetrievalCurrent,
  indexRetrievalGeneration,
  repositoryCommit,
  type RetrievalIndexPerformance,
} from "./retrieval-indexer.js";
import { benchmarkRetrievalPerformance } from "./retrieval-performance.js";
import { PostgresRetrievalStore, RetrievalEngine } from "./retrieval-query.js";
import { parseRetrievalRequest } from "./retrieval-query-contract.js";
import type { EmbeddingProvider } from "./retrieval-types.js";

const root = process.cwd();
let database: RetrievalDatabase | undefined;

try {
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  const command = args.shift();
  if (command === "units") {
    assertNoArguments(args);
    const artifacts = await expectedRetrievalArtifacts(root);
    const written = await writeRetrievalArtifacts(root, artifacts);
    console.log(`Generated ${written.length} deterministic retrieval artifact(s).`);
  } else if (command === "units-check") {
    assertNoArguments(args);
    const artifacts = await expectedRetrievalArtifacts(root);
    const checks = await checkRetrievalArtifacts(root, artifacts);
    const changed = checks.filter((item) => item.status !== "current");
    for (const item of changed) console.error(`${item.status.toUpperCase()} ${item.path}`);
    console.log(
      `Retrieval artifact check: ${checks.length - changed.length}/${checks.length} current.`,
    );
    if (changed.length > 0) process.exitCode = 1;
  } else if (command === "migrate") {
    assertNoArguments(args);
    database = createDatabase();
    const applied = await database.migrate(root);
    console.log(`Applied ${applied.length} retrieval migration(s).`);
  } else if (command === "index" || command === "check") {
    assertNoArguments(args);
    database = createDatabase();
    const artifacts = await currentArtifacts();
    const provider = createProvider();
    assertClassificationAllowed(provider);
    const commit = await repositoryCommit(root);
    const performance = command === "index" ? emptyIndexPerformance() : undefined;
    const generation =
      command === "index"
        ? await indexRetrievalGeneration(database, artifacts, provider, commit, performance)
        : await checkRetrievalCurrent(database, artifacts, provider, commit);
    console.log(
      serializeGraphValue({
        ...publicGeneration(generation),
        ...(performance ? { performance } : {}),
      }),
    );
  } else if (command === "query") {
    const raw = await parseRetrievalCliQuery(args);
    const request = parseRetrievalRequest(raw);
    database = createDatabase();
    const artifacts = await currentArtifacts();
    const provider = createProvider();
    assertClassificationAllowed(provider);
    const commit = await repositoryCommit(root);
    const generation = await checkRetrievalCurrent(database, artifacts, provider, commit);
    const graph = await loadValidatedGraph(root);
    const engine = new RetrievalEngine(
      new PostgresRetrievalStore(database.pool),
      provider,
      graph,
      generation,
    );
    console.log(serializeGraphValue(await engine.query(request)));
  } else if (command === "evaluate") {
    assertNoArguments(args);
    database = createDatabase();
    const artifacts = await currentArtifacts();
    const provider = createProvider();
    assertClassificationAllowed(provider);
    const commit = await repositoryCommit(root);
    const generation = await checkRetrievalCurrent(database, artifacts, provider, commit);
    const graph = await loadValidatedGraph(root);
    const engine = new RetrievalEngine(
      new PostgresRetrievalStore(database.pool),
      provider,
      graph,
      generation,
    );
    const benchmark = await loadRetrievalGolden(`${root}/evaluation/retrieval-golden.yaml`);
    const report = await evaluateRetrieval(benchmark, (_mode, request) => engine.query(request));
    console.log(serializeGraphValue(report));
    if (!report.gates.passed) process.exitCode = 1;
  } else if (command === "benchmark") {
    assertNoArguments(args);
    database = createDatabase();
    const artifacts = await currentArtifacts();
    const provider = createProvider();
    assertClassificationAllowed(provider);
    const commit = await repositoryCommit(root);
    const generation = await checkRetrievalCurrent(database, artifacts, provider, commit);
    const graph = await loadValidatedGraph(root);
    const store = new PostgresRetrievalStore(database.pool);
    console.log(
      serializeGraphValue(
        await benchmarkRetrievalPerformance(database, store, provider, graph, generation),
      ),
    );
  } else {
    throw new Error(`RETRIEVAL_COMMAND_UNKNOWN Unknown command '${String(command)}'.\n${usage()}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (database) await database.close();
}

async function currentArtifacts() {
  const expected = await expectedRetrievalArtifacts(root);
  return loadCurrentRetrievalArtifacts(root, expected);
}

function createDatabase(): RetrievalDatabase {
  return new RetrievalDatabase({
    connectionString:
      process.env.RETRIEVAL_DATABASE_URL ??
      "postgresql://aks:aks@127.0.0.1:54329/architecture_knowledge",
  });
}

function createProvider(): EmbeddingProvider {
  const selected = process.env.RETRIEVAL_EMBEDDING_PROVIDER ?? "fake";
  if (selected === "fake") return new DeterministicFakeEmbeddingProvider();
  if (selected === "openai") {
    return new OpenAIEmbeddingProvider({
      apiKey: process.env.OPENAI_API_KEY ?? "",
      allowedDataClassifications: splitEnvironmentList(
        process.env.RETRIEVAL_EXTERNAL_ALLOWED_CLASSIFICATIONS ?? "public",
      ),
    });
  }
  throw new Error(`RETRIEVAL_EMBEDDING_PROVIDER_UNKNOWN '${selected}'`);
}

function assertClassificationAllowed(provider: EmbeddingProvider): void {
  const classification = process.env.RETRIEVAL_DATA_CLASSIFICATION ?? "public";
  if (!provider.allowedDataClassifications.includes(classification)) {
    throw new Error(`RETRIEVAL_DATA_CLASSIFICATION_DENIED '${classification}'`);
  }
}

function publicGeneration(generation: Awaited<ReturnType<typeof checkRetrievalCurrent>>) {
  return {
    generation_id: generation.generation_id,
    repository_commit: generation.repository_commit,
    graph_input_fingerprint: generation.graph_input_fingerprint,
    retrieval_manifest_root: generation.retrieval_manifest_root,
    embedding_provider: generation.embedding_provider,
    embedding_model: generation.embedding_model,
    embedding_dimension: generation.embedding_dimension,
    status: generation.status,
    unit_count: generation.unit_count,
    manifest_hash: generation.manifest_hash,
  };
}

function splitEnvironmentList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function assertNoArguments(args: string[]): void {
  if (args.length > 0) throw new Error(`RETRIEVAL_ARGUMENT_UNKNOWN Unexpected '${args[0]}'.`);
}

function usage(): string {
  return "Usage: retrieval <units|units-check|migrate|index|check|query|evaluate|benchmark>";
}

function emptyIndexPerformance(): RetrievalIndexPerformance {
  return {
    index_build_duration_ms: 0,
    embedding_provider_duration_ms: 0,
    embedding_requested_count: 0,
    embedding_cache_hit_count: 0,
    reused_active_generation: false,
  };
}
