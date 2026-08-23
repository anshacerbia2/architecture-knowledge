import process from "node:process";

import {
  DeterministicFakeEmbeddingProvider,
  OpenAIEmbeddingProvider,
} from "./embedding-provider.js";
import { serializeGraphValue } from "./graph-projector.js";
import { parseRagCliInput } from "./rag-cli-arguments.js";
import { createRagCitationAuthority } from "./rag-citation-authority.js";
import { buildRagContext } from "./rag-context.js";
import { RagEngine } from "./rag-engine.js";
import { evaluateRag, loadRagGolden } from "./rag-evaluation.js";
import { DeterministicFakeRagProvider, OpenAIRagProvider } from "./rag-provider.js";
import { parseRagRequest } from "./rag-request.js";
import type { RagCitationAuthority, RagModelProvider } from "./rag-types.js";
import {
  expectedRetrievalArtifacts,
  loadCurrentRetrievalArtifacts,
  loadValidatedGraph,
} from "./retrieval-artifacts.js";
import { RetrievalDatabase } from "./retrieval-database.js";
import { checkRetrievalCurrent, repositoryCommit } from "./retrieval-indexer.js";
import { PostgresRetrievalStore, RetrievalEngine } from "./retrieval-query.js";
import type { EmbeddingProvider } from "./retrieval-types.js";

const root = process.cwd();
let database: RetrievalDatabase | undefined;

try {
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  const command = args.shift();
  if (command === "answer" || command === "context") {
    const cli = await parseRagCliInput(args, process.env.RETRIEVAL_DATA_CLASSIFICATION ?? "public");
    const request = parseRagRequest(cli.input);
    const runtime = await createRuntime();
    const retrieval = await runtime.retriever.query(request.retrieval);
    if (command === "context") {
      console.log(
        serializeGraphValue(buildRagContext(request, retrieval, runtime.citationAuthority)),
      );
    } else {
      const provider = createRagProvider();
      const engine = new RagEngine(
        { query: async () => retrieval },
        provider,
        runtime.citationAuthority,
      );
      const answer = await engine.answer(request);
      console.log(cli.json ? serializeGraphValue(answer) : answer.rendered_markdown);
    }
  } else if (command === "evaluate") {
    assertNoArguments(args);
    const runtime = await createRuntime();
    const provider = createRagProvider();
    const engine = new RagEngine(runtime.retriever, provider, runtime.citationAuthority);
    const benchmark = await loadRagGolden(`${root}/evaluation/rag-golden.yaml`);
    const report = await evaluateRag(benchmark, (request) => engine.answer(request));
    console.log(serializeGraphValue(report));
    if (!report.gates.passed) process.exitCode = 1;
  } else {
    throw new Error(`RAG_COMMAND_UNKNOWN Unknown command '${String(command)}'.\n${usage()}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (database) await database.close();
}

async function createRuntime(): Promise<{
  retriever: RetrievalEngine;
  citationAuthority: RagCitationAuthority;
}> {
  database = new RetrievalDatabase({
    connectionString:
      process.env.RETRIEVAL_DATABASE_URL ??
      "postgresql://aks:aks@127.0.0.1:54329/architecture_knowledge",
  });
  const expected = await expectedRetrievalArtifacts(root);
  const artifacts = await loadCurrentRetrievalArtifacts(root, expected);
  const embedding = createEmbeddingProvider();
  assertClassificationAllowed(embedding);
  const commit = await repositoryCommit(root);
  const generation = await checkRetrievalCurrent(database, artifacts, embedding, commit);
  const graph = await loadValidatedGraph(root);
  return {
    retriever: new RetrievalEngine(
      new PostgresRetrievalStore(database.pool),
      embedding,
      graph,
      generation,
    ),
    citationAuthority: createRagCitationAuthority(graph),
  };
}

function createEmbeddingProvider(): EmbeddingProvider {
  const selected = process.env.RETRIEVAL_EMBEDDING_PROVIDER ?? "fake";
  if (selected === "fake") return new DeterministicFakeEmbeddingProvider();
  if (selected === "openai")
    return new OpenAIEmbeddingProvider({
      apiKey: process.env.OPENAI_API_KEY ?? "",
      allowedDataClassifications: splitEnvironmentList(
        process.env.RETRIEVAL_EXTERNAL_ALLOWED_CLASSIFICATIONS ?? "public",
      ),
    });
  throw new Error(`RETRIEVAL_EMBEDDING_PROVIDER_UNKNOWN '${selected}'`);
}

function createRagProvider(): RagModelProvider {
  const selected = process.env.RAG_MODEL_PROVIDER ?? "fake";
  if (selected === "fake") return new DeterministicFakeRagProvider();
  if (selected === "openai")
    return new OpenAIRagProvider({
      apiKey: process.env.OPENAI_API_KEY ?? "",
      allowedDataClassifications: splitEnvironmentList(
        process.env.RAG_EXTERNAL_ALLOWED_CLASSIFICATIONS ?? "public",
      ),
    });
  throw new Error(`RAG_MODEL_PROVIDER_UNKNOWN '${selected}'`);
}

function assertClassificationAllowed(provider: {
  allowedDataClassifications: readonly string[];
}): void {
  const classification = process.env.RETRIEVAL_DATA_CLASSIFICATION ?? "public";
  if (!provider.allowedDataClassifications.includes(classification))
    throw new Error(`RAG_DATA_CLASSIFICATION_DENIED '${classification}'`);
}

function splitEnvironmentList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function assertNoArguments(args: string[]): void {
  if (args.length > 0) throw new Error(`RAG_ARGUMENT_UNKNOWN Unexpected '${args[0]}'.`);
}

function usage(): string {
  return "Usage: rag <answer|context|evaluate>";
}
