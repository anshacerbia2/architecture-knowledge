// Adapter boundary: only this package imports the compiled public kernel facade.
import {
  loadValidatedGraph,
  loadCurrentRetrievalArtifacts,
  buildRetrievalArtifacts,
  RetrievalDatabase,
  checkRetrievalCurrent,
  RetrievalEngine,
  PostgresRetrievalStore,
  parseRetrievalRequest,
  parseRagRequest,
  RagEngine,
  createRagCitationAuthority,
  type GraphArtifacts,
  type GraphEdge,
  type RetrievalArtifacts,
} from "architecture-knowledge-system/runtime";
import type { KnowledgePort } from "../../application/src/knowledge-port.js";
import { AppError } from "../../application/src/errors.js";
import type {
  Answer,
  AskInput,
  Edge,
  GraphView,
  RecordView,
  SearchInput,
  SearchOutput,
  Summary,
  SystemStatus,
  RetrievalDatabaseMode,
} from "../../contracts/src/index.js";
import { cleanCommit, immutableCopy } from "./snapshot.js";
import { providers, type ProviderSettings } from "./providers.js";

function edgeDto(edge: GraphEdge): Edge {
  return {
    id: edge.id,
    from: edge.from,
    to: edge.to,
    predicate: edge.predicate,
    direction: edge.direction,
    traversable: edge.traversable,
    conditions: edge.conditions,
    exclusion_reason: edge.traversal_exclusion_reason,
  };
}

export class KernelAdapter implements KnowledgePort {
  private readonly embedding;
  private readonly provider;
  private readonly nodes: Summary[];
  private constructor(
    readonly commit: string,
    private readonly bundle: GraphArtifacts,
    private readonly artifacts: RetrievalArtifacts,
    private readonly database: RetrievalDatabase,
    private readonly databaseMode: RetrievalDatabaseMode,
    private readonly runtime: ReturnType<typeof providers>,
  ) {
    this.embedding = runtime.embedding;
    this.provider = runtime.answer;
    this.nodes = bundle.nodes.map((n) => ({ ...n, title: n.title ?? n.id }));
  }
  static async create(
    root: string,
    connectionString: string,
    databaseMode: RetrievalDatabaseMode = "local",
    settings: ProviderSettings = { mode: "fake" },
  ): Promise<KernelAdapter> {
    const commit = await cleanCommit(root);
    const graph = await loadValidatedGraph(root);
    const artifacts = await loadCurrentRetrievalArtifacts(root, buildRetrievalArtifacts(graph));
    if ((await cleanCommit(root)) !== commit)
      throw new AppError("SNAPSHOT_CHANGED", 409, "Repository changed during startup.");
    const runtime = providers(settings, artifacts.manifest.manifest_root_hash);
    const db = new RetrievalDatabase({
      connectionString,
      maxConnections: 4,
      statementTimeoutMs: 10000,
    });
    // pg Pool exposes these supported options; the kernel factory does not expose them yet.
    db.pool.options.connectionTimeoutMillis = 3000;
    db.pool.options.query_timeout = 15000;
    db.pool.options.options = "-c default_transaction_read_only=on";
    Object.assign(db.pool.options, {
      enableChannelBinding: databaseMode === "hosted",
    });
    return new KernelAdapter(
      commit,
      immutableCopy(graph),
      immutableCopy(artifacts),
      db,
      databaseMode,
      runtime,
    );
  }
  private async current() {
    try {
      return await checkRetrievalCurrent(
        this.database,
        this.artifacts,
        this.embedding,
        this.commit,
      );
    } catch (error) {
      const code = error instanceof Error ? error.message.split(" ")[0] : "";
      if (code === "RETRIEVAL_INDEX_NOT_CURRENT" || code === "RETRIEVAL_GENERATION_MISSING") {
        throw new AppError(
          code,
          503,
          "Index missing or stale. Follow the app README for indexing with the configured embedding provider.",
        );
      }
      throw new AppError(
        "DATABASE_UNAVAILABLE",
        503,
        "PostgreSQL/pgvector is unavailable or not initialized. See System status and setup instructions.",
      );
    }
  }
  async status(): Promise<SystemStatus> {
    const graph: SystemStatus["graph"] = "ready";
    let retrieval: SystemStatus["retrieval"] = "unavailable";
    let retrieval_code: string | null = null;
    let generation_id: string | null = null;
    try {
      const g = await this.current();
      generation_id = g.generation_id;
      retrieval = "ready";
    } catch (error) {
      retrieval_code = error instanceof AppError ? error.code : "DATABASE_UNAVAILABLE";
    }
    const counts: Record<string, number> = {};
    for (const n of this.nodes) counts[n.family] = (counts[n.family] ?? 0) + 1;
    return {
      repository_commit: this.commit,
      graph,
      retrieval,
      retrieval_code,
      generation_id,
      database_mode: this.databaseMode,
      counts,
      provider_mode:
        this.runtime.mode === "openrouter-free"
          ? "openrouter-free"
          : this.runtime.budget
            ? "openai-live-pilot"
            : "deterministic-demo",
      ai_connection: this.runtime.credential
        ? { mode: this.runtime.credential.mode, connected: this.runtime.credential.connected() }
        : null,
      retrieval_strategy: this.runtime.mode === "openrouter-free" ? "lexical" : "hybrid-graph",
      pilot_budget: this.runtime.budget?.status() ?? null,
      recommendations_enabled: false,
    };
  }
  async catalog(): Promise<Summary[]> {
    return structuredClone(this.nodes);
  }
  async record(id: string): Promise<RecordView> {
    const summary = this.nodes.find((n) => n.id === id);
    const record = [
      ...this.bundle.concepts,
      ...this.bundle.claims,
      ...this.bundle.sources,
      ...this.bundle.relationships,
      ...this.bundle.decisionGuides,
    ].find((n) => n.id === id);
    if (!summary || !record) throw new AppError("NOT_FOUND", 404, "Knowledge record not found.");
    return structuredClone({
      summary,
      fields: record,
      connections: this.bundle.edges.filter((e) => e.from === id || e.to === id).map(edgeDto),
    });
  }
  async graph(id: string): Promise<GraphView> {
    await this.record(id);
    // Inspection only, not a traversal or applicability decision. Excluded edges remain labeled.
    const all = this.bundle.edges.filter((e) => e.from === id || e.to === id);
    const edges = all.slice(0, 40).map(edgeDto);
    const ids = new Set([id, ...edges.flatMap((e) => [e.from, e.to])]);
    return structuredClone({
      nodes: this.nodes.filter((n) => ids.has(n.id)),
      edges,
      truncated: all.length > edges.length,
    });
  }
  private async engine() {
    const generation = await this.current();
    return {
      generation,
      engine: new RetrievalEngine(
        new PostgresRetrievalStore(this.database.pool),
        this.embedding,
        this.bundle,
        generation,
      ),
    };
  }
  private async verifyAfter(generationId: string) {
    const current = await this.current();
    if (current.generation_id !== generationId)
      throw new AppError(
        "SNAPSHOT_CHANGED",
        409,
        "Index changed during the request. Retry after maintenance.",
      );
  }
  async search(input: SearchInput): Promise<SearchOutput> {
    if (this.runtime.mode === "openrouter-free" && input.mode !== "lexical")
      throw new AppError(
        "FREE_MODE_LEXICAL_ONLY",
        400,
        "Select Lexical search in free mode. No paid or fake semantic retrieval is used.",
      );
    const { engine, generation } = await this.engine();
    const packet = await engine.query(
      parseRetrievalRequest({ text: input.text, mode: input.mode, top_k: 10 }),
    );
    await this.verifyAfter(generation.generation_id);
    return {
      generation_id: generation.generation_id,
      diagnostics: packet.diagnostics.map((d) => d.code),
      hits: packet.results.map((r) => ({
        unit_id: r.unit.unit_id,
        record_id: r.unit.record_id,
        title: r.unit.title,
        text: r.unit.retrieval_text,
        status: r.unit.lifecycle_status,
        kind: r.unit.unit_kind,
        graph_path: r.graph_path,
      })),
    };
  }
  async ask(input: AskInput): Promise<Answer> {
    // Must precede retrieval: query embedding itself sends the question externally.
    if (this.runtime.mode !== "fake" && input.data_classification !== "public")
      throw new AppError(
        "PILOT_PUBLIC_ONLY",
        403,
        "Live pilot accepts public, non-secret questions only.",
      );
    const { engine, generation } = await this.engine();
    const rag = new RagEngine(engine, this.provider, createRagCitationAuthority(this.bundle));
    const packet = await rag.answer(
      parseRagRequest({
        ...input,
        ...(this.runtime.mode === "openrouter-free"
          ? {
              retrieval: { mode: "lexical", graph: { enabled: false, max_depth: 0 } },
            }
          : {}),
      }),
    );
    await this.verifyAfter(generation.generation_id);
    // Explicit DTO: never leak retrieval internals or unvalidated provider output.
    return {
      question: packet.question,
      status: packet.status,
      summary: packet.summary,
      statements: packet.statements,
      uncertainties: packet.uncertainties,
      refusal_reason: packet.refusal_reason,
      model_invoked: packet.model_invoked,
      provider: packet.provider,
      provenance: packet.provenance,
    };
  }
  close() {
    return this.database.close();
  }
}
