import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  commit: vi.fn(),
  loadGraph: vi.fn(),
  loadArtifacts: vi.fn(),
  current: vi.fn(),
  query: vi.fn(),
  answer: vi.fn(),
  close: vi.fn(),
  options: {} as Record<string, unknown>,
  databaseOptions: vi.fn(),
}));
vi.mock("../packages/knowledge-adapter/src/snapshot.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../packages/knowledge-adapter/src/snapshot.js")>()),
  cleanCommit: state.commit,
}));
vi.mock("architecture-knowledge-system/runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("architecture-knowledge-system/runtime")>()),
  loadValidatedGraph: state.loadGraph,
  loadCurrentRetrievalArtifacts: state.loadArtifacts,
  buildRetrievalArtifacts: () => ({}),
  RetrievalDatabase: class {
    constructor(options: unknown) {
      state.databaseOptions(options);
    }
    pool = { options: state.options };
    close = state.close;
  },
  checkRetrievalCurrent: state.current,
  PostgresRetrievalStore: class {},
  RetrievalEngine: class {
    query = state.query;
  },
  RagEngine: class {
    answer = state.answer;
  },
}));
import { KernelAdapter } from "../packages/knowledge-adapter/src/kernel-adapter.js";
import { answer, node } from "./fixture.js";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PilotBudget } from "../packages/knowledge-adapter/src/pilot-budget.js";
import { OpenRouterOAuthConnector } from "../packages/ai-connectors/src/openrouter-connectors.js";

const graph = () => ({
  nodes: [{ ...node }, { ...node, id: "AKC-000013", title: null }],
  edges: [
    {
      id: "edge",
      from: node.id,
      to: "AKC-000013",
      predicate: "related-to",
      direction: "directed",
      traversable: false,
      conditions: ["Synthetic edge-local condition"],
      traversal_exclusion_reason: "synthetic exclusion",
    },
  ],
  concepts: [{ ...node, record_kind: "concept" }],
  claims: [],
  sources: [],
  relationships: [],
  decisionGuides: [],
});
beforeEach(() => {
  vi.resetAllMocks();
  state.commit.mockResolvedValue("a".repeat(40));
  state.loadGraph.mockResolvedValue(graph());
  state.loadArtifacts.mockResolvedValue({ units: [], manifest: {} });
  state.current.mockResolvedValue({ generation_id: "synthetic-generation" });
  state.query.mockResolvedValue({
    results: [
      {
        unit: {
          unit_id: "unit-1",
          record_id: node.id,
          title: node.title,
          retrieval_text: "synthetic",
          lifecycle_status: "proposed",
          unit_kind: "claim",
        },
        graph_path: [node.id],
      },
    ],
    diagnostics: [{ code: "TEST" }],
  });
  state.answer.mockResolvedValue({
    ...answer,
    retrieval: { internal: "not an app DTO" },
  });
});
const create = () => KernelAdapter.create("synthetic-root", "postgresql://localhost/synthetic");
it("free mode uses lexical retrieval only and denies private inputs before any retrieval", async () => {
  const manifest = `sha256:${"a".repeat(64)}`;
  state.loadArtifacts.mockResolvedValue({ units: [], manifest: { manifest_root_hash: manifest } });
  const adapter = await KernelAdapter.create(
    "synthetic-root",
    "postgresql://localhost/synthetic",
    "local",
    {
      mode: "openrouter-free",
      publicManifest: manifest,
      credential: new OpenRouterOAuthConnector(),
    },
  );
  await expect(
    adapter.ask({ question: "secret", data_classification: "confidential" }),
  ).rejects.toMatchObject({ code: "PILOT_PUBLIC_ONLY" });
  await expect(adapter.search({ text: "public", mode: "hybrid-graph" })).rejects.toMatchObject({
    code: "FREE_MODE_LEXICAL_ONLY",
  });
  expect(state.current).not.toHaveBeenCalled();
  await adapter.ask({ question: "public", data_classification: "public" });
  expect(state.answer.mock.calls[0]![0]).toMatchObject({
    retrieval: { mode: "lexical", graph: { enabled: false, max_depth: 0 } },
  });
  await adapter.search({ text: "public", mode: "lexical" });
  expect(state.query.mock.calls[0]![0].mode).toBe("lexical");
  expect(await adapter.status()).toMatchObject({
    provider_mode: "openrouter-free",
    retrieval_strategy: "lexical",
    ai_connection: { mode: "oauth", connected: false },
  });
});
it("maps governed records without reclassifying excluded relationships", async () => {
  const adapter = await create();
  expect(await adapter.catalog()).toHaveLength(2);
  expect((await adapter.record(node.id)).connections[0]).toMatchObject({
    traversable: false,
    exclusion_reason: "synthetic exclusion",
  });
  expect((await adapter.graph(node.id)).truncated).toBe(false);
  await expect(adapter.record("AKC-999999")).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  await adapter.close();
  expect(state.close).toHaveBeenCalledOnce();
  expect(state.options).toMatchObject({
    connectionTimeoutMillis: 3000,
    query_timeout: 15000,
    options: "-c default_transaction_read_only=on",
    enableChannelBinding: false,
  });
  expect(state.databaseOptions).toHaveBeenCalledWith({
    connectionString: "postgresql://localhost/synthetic",
    maxConnections: 4,
    statementTimeoutMs: 10000,
  });
});
it("enables channel binding for hosted database connections", async () => {
  await KernelAdapter.create(
    "synthetic-root",
    "postgresql://reader:secret@synthetic.example.invalid/neondb",
    "hosted",
  );
  expect(state.options.enableChannelBinding).toBe(true);
});
it("bounds graph inspection to forty edges and marks truncation", async () => {
  const bundle = graph();
  bundle.edges = Array.from({ length: 41 }, (_, i) => ({
    ...bundle.edges[0]!,
    id: `edge-${i}`,
  }));
  state.loadGraph.mockResolvedValue(bundle);
  const adapter = await create();
  expect(await adapter.graph(node.id)).toMatchObject({
    truncated: true,
    edges: expect.any(Array),
  });
  expect((await adapter.graph(node.id)).edges).toHaveLength(40);
});
it("includes incoming edges and excludes unrelated records in a graph view", async () => {
  const bundle = graph();
  bundle.edges = [
    { ...bundle.edges[0]!, id: "incoming", from: "AKC-000013", to: node.id },
    { ...bundle.edges[0]!, id: "unrelated", from: "AKC-000013", to: "AKC-000013" },
  ];
  bundle.nodes.push({ ...node, id: "AKC-000099" });
  state.loadGraph.mockResolvedValue(bundle);
  const adapter = await create();
  expect((await adapter.record(node.id)).connections.map((e) => e.id)).toEqual(["incoming"]);
  const view = await adapter.graph(node.id);
  expect(view.edges.map((e) => e.id)).toEqual(["incoming"]);
  expect(view.nodes.map((n) => n.id)).toEqual([node.id, "AKC-000013"]);
  await expect(adapter.record("AKC-000099")).rejects.toMatchObject({ code: "NOT_FOUND" });
});
it("binds search and answer to currentness both before and after the operation", async () => {
  const adapter = await create();
  expect(await adapter.search({ text: "retry", mode: "hybrid" })).toMatchObject({
    generation_id: "synthetic-generation",
    hits: [{ record_id: node.id }],
  });
  expect(state.current).toHaveBeenCalledTimes(2);
  const result = await adapter.ask({
    question: "retry",
    data_classification: "public",
  });
  expect(result).toEqual(answer);
  expect(result).not.toHaveProperty("retrieval");
  expect(state.current).toHaveBeenCalledTimes(4);
});
it.each(["RETRIEVAL_GENERATION_MISSING", "RETRIEVAL_INDEX_NOT_CURRENT"])(
  "fails closed on %s without invoking providers",
  async (code) => {
    const adapter = await create();
    state.current.mockRejectedValue(new Error(`${code} extra detail`));
    await expect(
      adapter.ask({ question: "retry", data_classification: "public" }),
    ).rejects.toMatchObject({ code, status: 503 });
    expect(state.answer).not.toHaveBeenCalled();
    expect((await adapter.status()).retrieval_code).toBe(code);
  },
);
it("reports unavailable DB without leaking connection details", async () => {
  const adapter = await create();
  state.current.mockRejectedValue(new Error("password secret refused"));
  const status = await adapter.status();
  expect(status.retrieval_code).toBe("DATABASE_UNAVAILABLE");
  expect(JSON.stringify(status)).not.toContain("secret");
});
it("handles non-Error database failures without leaking arbitrary payloads", async () => {
  const adapter = await create();
  state.current.mockRejectedValue({ password: "secret" });
  await expect(adapter.search({ text: "retry", mode: "hybrid" })).rejects.toMatchObject({
    code: "DATABASE_UNAVAILABLE",
  });
});
it("rejects startup races", async () => {
  state.commit.mockResolvedValueOnce("a").mockResolvedValueOnce("b");
  await expect(create()).rejects.toMatchObject({ code: "SNAPSHOT_CHANGED" });
});
it("serves a detached snapshot without Git or loaders on any request path", async () => {
  const loaded = graph();
  state.loadGraph.mockResolvedValue(loaded);
  const adapter = await create();
  state.commit.mockRejectedValue(new Error("Authoring checkout changed after startup"));
  state.loadGraph.mockRejectedValue(new Error("Filesystem unavailable"));
  loaded.concepts[0]!.title = "tampered loader input";
  loaded.nodes[0]!.title = "tampered node";
  const catalog = await adapter.catalog();
  catalog[0]!.title = "consumer mutation";
  const record = await adapter.record(node.id);
  record.fields.title = "consumer mutation";
  const view = await adapter.graph(node.id);
  view.edges[0]!.conditions.length = 0;
  await Promise.all([
    adapter.status(),
    adapter.search({ text: "retry", mode: "hybrid" }),
    adapter.ask({ question: "retry", data_classification: "public" }),
  ]);
  expect((await adapter.catalog())[0]!.title).toBe(node.title);
  expect((await adapter.record(node.id)).fields.title).toBe(node.title);
  expect((await adapter.graph(node.id)).edges[0]!.conditions).toHaveLength(1);
  expect(state.commit).toHaveBeenCalledTimes(2);
  expect(state.loadGraph).toHaveBeenCalledOnce();
  expect(state.loadArtifacts).toHaveBeenCalledOnce();
});
it("discards an answer on same-generation database integrity failure", async () => {
  const adapter = await create();
  state.current
    .mockResolvedValueOnce({ generation_id: "unchanged" })
    .mockRejectedValueOnce(new Error("RETRIEVAL_INDEX_NOT_CURRENT database_manifest_root"));
  await expect(
    adapter.ask({ question: "retry", data_classification: "public" }),
  ).rejects.toMatchObject({ code: "RETRIEVAL_INDEX_NOT_CURRENT" });
  expect(state.answer).toHaveBeenCalledOnce();
});
it("discards generated output if active generation changes mid-request", async () => {
  const adapter = await create();
  state.current
    .mockResolvedValueOnce({ generation_id: "first" })
    .mockResolvedValueOnce({ generation_id: "second" });
  await expect(
    adapter.ask({ question: "retry", data_classification: "public" }),
  ).rejects.toMatchObject({ code: "SNAPSHOT_CHANGED" });
});
it("never packages a failed grounding result", async () => {
  const adapter = await create();
  state.answer.mockRejectedValue(new Error("RAG_GROUNDING_INVALID"));
  await expect(adapter.ask({ question: "retry", data_classification: "public" })).rejects.toThrow(
    "RAG_GROUNDING_INVALID",
  );
});
it("reports readiness and leaves lifecycle unchanged", async () => {
  const adapter = await create();
  expect(await adapter.status()).toMatchObject({
    graph: "ready",
    database_mode: "local",
    retrieval: "ready",
    recommendations_enabled: false,
    provider_mode: "deterministic-demo",
  });
  expect((await adapter.catalog())[0]?.status).toBe("proposed");
});

it("rejects non-public live questions before DB access or query embedding; exposes safe mode only", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "atlas-classification-test-"));
  try {
    const budgetFile = path.join(directory, "budget.txt");
    new PilotBudget(budgetFile).initialize();
    const manifest = `sha256:${"a".repeat(64)}`;
    state.loadArtifacts.mockResolvedValue({
      units: [],
      manifest: { manifest_root_hash: manifest },
    });
    const adapter = await KernelAdapter.create(
      "synthetic-root",
      "postgresql://localhost/synthetic",
      "local",
      {
        mode: "openai",
        apiKey: "synthetic-secret",
        publicManifest: manifest,
        budgetFile,
      },
    );
    for (const data_classification of ["internal", "confidential"] as const)
      await expect(
        adapter.ask({ question: "private synthetic", data_classification }),
      ).rejects.toMatchObject({ code: "PILOT_PUBLIC_ONLY" });
    expect(state.current).not.toHaveBeenCalled();
    expect(state.query).not.toHaveBeenCalled();
    expect(state.answer).not.toHaveBeenCalled();
    const status = await adapter.status();
    expect(status.provider_mode).toBe("openai-live-pilot");
    expect(status.pilot_budget?.reserved_cents).toBe(0);
    expect(JSON.stringify(status)).not.toContain("synthetic-secret");
    expect(JSON.stringify(status)).not.toContain(budgetFile);
    await adapter.ask({ question: "public synthetic", data_classification: "public" });
    expect(state.answer).toHaveBeenCalledOnce();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
