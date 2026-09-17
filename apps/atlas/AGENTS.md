# App engineering boundaries

Use pnpm workspace commands. Preserve the root knowledge kernel and governed lifecycle. No automatic
source admission, claim approval, decision approval or corpus writes.

- `packages/contracts`: transport-neutral app DTOs; no runtime dependencies.
- `packages/application`: use cases and ports; depends only on contracts.
- `packages/ai-connectors`: backend-only credential adapters implementing application ports; never
  expose credentials to browser DTOs or import the knowledge kernel.
- `packages/knowledge-adapter`: the only module allowed to import the compiled
  `architecture-knowledge-system/runtime` public facade. Never import root `src/` directly.
- `apps/api`: HTTP delivery, validation, security and composition root.
- `apps/web`: presentation and HTTP client; never import server/application/adapter.
- `tests`: architecture, unit, HTTP and browser verification.

Do not add a generic model endpoint or stream unvalidated model tokens. Do not log prompt bodies,
model output, secrets or database connection strings. Local-only is not multi-user authentication.
Do not expose this server to a LAN. Keep adapters replaceable through ports; avoid speculative
microservices. Record decisions and trade-offs in docs. A test pass is not production certification.
