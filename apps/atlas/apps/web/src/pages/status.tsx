import { useQuery } from "@tanstack/react-query";
import type { SystemStatus } from "../../../../packages/contracts/src/index.js";
import { api } from "../api/client.js";
import { Loading, Notice, Trace } from "../components/common.js";
import { AiConnection } from "../components/ai-connection.js";

export default function Status() {
  const result = useQuery({
    queryKey: ["status"],
    queryFn: ({ signal }) => api<SystemStatus>("/status", undefined, signal),
  });
  const status = result.data?.data;
  return (
    <>
      <section className="page-heading">
        <div className="eyebrow">OBSERVE / 04</div>
        <h1>Know what is running.</h1>
        <p>Readiness, data provenance and honest boundaries for this local pilot.</p>
        <button
          className="secondary"
          disabled={result.isFetching}
          onClick={() => {
            void result.refetch();
          }}
        >
          Refresh status
        </button>
      </section>
      <Notice error={result.error} />
      {result.isPending && <Loading />}
      {status && (
        <>
          <div className="status-grid">
            <article className="panel">
              <span className="eyebrow">KNOWLEDGE SNAPSHOT</span>
              <h2>{status.graph === "ready" ? "Ready to explore" : "Restart required"}</h2>
              <p>
                Validated snapshot loaded at startup. Restart the app to load committed knowledge
                changes.
              </p>
            </article>
            <article className="panel">
              <span className="eyebrow">POSTGRESQL / PGVECTOR · {status.database_mode}</span>
              <h2>{status.retrieval === "ready" ? "Ready to retrieve" : "Setup required"}</h2>
              <p>
                {status.retrieval_code ??
                  "Active generation matches the loaded snapshot and embedding contract."}
              </p>
            </article>
            <article className="panel">
              <span className="eyebrow">ANSWER PROVIDER</span>
              <h2>
                {status.provider_mode === "openrouter-free"
                  ? "OpenRouter free"
                  : status.provider_mode === "openai-live-pilot"
                    ? "OpenAI live pilot"
                    : "Deterministic demo"}
              </h2>
              <p>
                {status.provider_mode === "openrouter-free"
                  ? "NVIDIA Nemotron 3 Super (:free). Lexical-only retrieval in Neon; no external embeddings or paid fallback."
                  : status.provider_mode === "openai-live-pilot"
                    ? "gpt-5.6-sol answers + text-embedding-3-small embeddings. Public non-secret inputs only; external API calls consume budget."
                    : "Local fake embeddings and answer provider. No external model calls or API keys."}
              </p>
              {status.pilot_budget && (
                <p>
                  Reserved ${(status.pilot_budget.reserved_cents / 100).toFixed(2)} / $
                  {(status.pilot_budget.limit_cents / 100).toFixed(2)}. Conservative reservations,
                  not actual billing. Expires {status.pilot_budget.expires_at}.
                </p>
              )}
            </article>
          </div>
          {status.ai_connection && (
            <AiConnection
              connection={status.ai_connection}
              refresh={() => {
                void result.refetch();
              }}
            />
          )}
          <section className="panel">
            <h2>Indexed knowledge snapshot</h2>
            <div className="metrics">
              {Object.entries(status.counts).map(([kind, count]) => (
                <div key={kind}>
                  <strong>{count}</strong>
                  <span>{kind}</span>
                </div>
              ))}
            </div>
            <dl className="fields">
              <div>
                <dt>Knowledge commit</dt>
                <dd className="mono">{status.repository_commit}</dd>
              </div>
              <div>
                <dt>Active retrieval generation</dt>
                <dd className="mono">{status.generation_id ?? "Unavailable"}</dd>
              </div>
            </dl>
          </section>
          {status.retrieval !== "ready" && (
            <section className="panel">
              <h2>Enable search & RAG</h2>
              <p>
                From the workspace root, configure your PostgreSQL connection and prepare the index.
                Hosted Neon works without Docker; see apps/atlas/README.md.
              </p>
              <pre>
                {status.provider_mode !== "deterministic-demo"
                  ? "pnpm app:pilot index\npnpm app:pilot check"
                  : "pnpm retrieval:migrate\npnpm retrieval:index\npnpm retrieval:check"}
              </pre>
              <p>
                See this app's README for the exact environment-variable setup. Do not use a
                production database or run destructive database reset commands.
              </p>
            </section>
          )}
          <div className="info-banner">
            <strong>Human authority stays with you</strong>
            <span>
              This app cannot edit knowledge, approve a claim, admit sources, or make an
              architecture decision.
            </span>
          </div>
          <Trace value={result.data!} />
        </>
      )}
    </>
  );
}
