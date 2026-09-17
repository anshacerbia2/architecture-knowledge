# Architecture Atlas

Local app for the governed Architecture Knowledge System. Atlas is a pnpm workspace package at
`apps/atlas`; kernel commands and governed content remain at repository root.

## Run from repository root

Requirements: Node 24.11.1, pnpm 10.23.0 and Git. One checkout and one lockfile.

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm app:start
```

Open http://127.0.0.1:4310. Stop with Ctrl+C. For development use `pnpm app:dev` and open
http://127.0.0.1:5173. The development proxy expects API port 4310. Rebuild the kernel after kernel
implementation changes; restart to load a new snapshot.

Startup requires a clean checkout, validated knowledge, and current generated artifacts. It detaches
and freezes the loaded graph and retrieval records. Authoring edits after startup do not change the
served snapshot; every response identifies the pinned SHA. Restart is an explicit activation step.
Search/Ask also require the DB generation for that exact SHA; missing, changed or tampered
generations fail closed.

## Configure PostgreSQL/pgvector

Server configuration is **`apps/atlas/.env`**. From repository root:

```powershell
# Only on first setup; do not overwrite an existing .env.
Copy-Item apps/atlas/.env.hosted.example apps/atlas/.env
notepad apps/atlas/.env
```

Set `PORT=4310`, `RETRIEVAL_DATABASE_MODE=hosted`, and `DATABASE_URL` to the Neon URL. Preserve its
TLS and channel-binding parameters. Pooled connections are suitable for runtime; a direct URL also
works for this small local pilot. Secrets stay server-side and are ignored by Git. Neither Docker
nor Neon CLI is required for hosted mode.

For migration/indexing, use the direct writer URL in a separate PowerShell terminal:

```powershell
$env:RETRIEVAL_DATABASE_URL = Read-Host "Paste direct Neon URL locally"
$env:RETRIEVAL_EMBEDDING_PROVIDER = "fake"
try {
    pnpm retrieval:migrate
    if ($LASTEXITCODE -ne 0) { throw "Migration failed" }
    pnpm retrieval:index
    if ($LASTEXITCODE -ne 0) { throw "Indexing failed" }
    pnpm retrieval:check
    if ($LASTEXITCODE -ne 0) { throw "Currentness check failed" }
} finally {
    Remove-Item Env:RETRIEVAL_DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:RETRIEVAL_EMBEDDING_PROVIDER -ErrorAction SilentlyContinue
}
```

Migration is needed on first setup or when new migrations arrive. Index after changing the pinned
commit, including documentation-only commits under the current generation contract. Password
rotation alone does not require indexing. No HTTP endpoint migrates or indexes automatically. The
app sets read-only transactions; a SELECT-only runtime role provides stronger database permissions
than an owner connection.

For local PostgreSQL use `.env.example` instead. Browse/graph work without a DB. System status must
show retrieval ready before Search or Ask can work.

## Features and evidence limits

- Explore concepts, claims, sources, relationships and decision guides.
- Inspect a one-hop graph (40-edge display limit), exclusions and conditions.
- Search PostgreSQL using lexical, hybrid or hybrid-graph retrieval.
- Ask a single question and inspect citations, uncertainty and provenance.

Embedding and answer providers default to deterministic demos. They exercise real storage and
retrieval, but do not establish live-model quality. Try:
`Can Retry and Circuit Breaker be combined?`

The opt-in [OpenAI live-provider pilot](docs/live-provider-pilot.md) uses a shared conservative USD
5 allowance, explicit public-corpus consent and server-only credentials. Follow that guide to
configure `apps/atlas/.env`, plan, initialize budget, index, check and activate. Do not use the
unbudgeted root retrieval CLI with live credentials for this pilot. No live calls occur just because
an API key exists.

Citation resolution does not prove semantic entailment. No decision approval or ADR/RFC/PAD
generator is provided. This app is loopback-only for one trusted OS user.

## Verification from repository root

```powershell
pnpm build
pnpm app:check
pnpm app:test:coverage
pnpm app:test:e2e
pnpm app:benchmark
```

Browser tests use Chrome locally and Playwright Chromium in CI. The root workflow tests Atlas on
Linux/Windows and its HTTP retrieval against real PostgreSQL on Linux. `ATLAS_TEST_DATABASE_URL`
opts into the DB integration test; without it the test is explicitly skipped. `BENCHMARK_DATABASE=1`
additionally measures DB operations.

Only `packages/knowledge-adapter` imports `architecture-knowledge-system/runtime`, which resolves to
compiled JavaScript and declarations. Package exports and architecture tests reject private kernel
imports. Local source TypeScript is not the runtime API.

- [Architecture and flows](docs/architecture.md)
- [Traceability](docs/traceability.md)
- [Original pilot handoff](docs/implementation-handoff.md)
- [Structural hardening and review dispositions](../../docs/structural-integration-hardening.md)
