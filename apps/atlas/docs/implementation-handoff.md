# Local app implementation handoff

Historical pilot record. Paths, source-bridge behavior and verification results below describe the
original sibling app. Current workspace instructions are in [README](../README.md); subsequent
changes are recorded in the
[structural hardening report](../../../docs/structural-integration-hardening.md).

Date: 2026-09-16. Scope: sibling-folder local app pilot. Knowledge baseline:
`8e2e565a7c13ea59db8f0ae1d1c96143d4fda431`.

## Delivered

- Separate `architecture-knowledge-app` folder, pnpm lockfile and contributor boundaries.
- React/Vite responsive catalog, record/evidence inspector, bounded graph view, single-turn answer
  view and system status.
- Fastify local-only API, strict request validation, safe errors and request provenance.
- Application port/use cases isolated from the HTTP framework and kernel implementation.
- Kernel adapter reusing validated artifacts, retrieval and RAG without CLI imports, corpus copies,
  migrations or knowledge writes.
- Explicit hosted pgvector configuration with TLS/channel-binding validation; database credentials
  remain in the ignored server-side `.env` file.
- Snapshot/current-generation checks before and after search/RAG; read-only pool; deterministic
  providers and explicit unavailable-DB behavior.
- Architecture decisions, detailed flow diagrams and requirement-to-test mapping.
- Linux + Windows workflow configuration, not yet hosted/executed.

## Verification and evidence boundaries

Final local run on Windows / Node 24.11.1 / pnpm 10.23.0:

| Gate                                                           | Result                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| Frozen dependency installation                                 | Pass                                                   |
| Formatting and strict typecheck                                | Pass                                                   |
| Production frontend build                                      | Pass; lazy route chunks emitted                        |
| Unit/API/adapter/architecture/Git tests                        | 39 passed                                              |
| Selected backend coverage                                      | 100% statements; 94.84% branches; 100% functions/lines |
| Chrome E2E tests                                               | 7 passed                                               |
| Production dependency advisory audit                           | No known vulnerabilities reported at run time          |
| Workflow YAML, OS matrix and repository target                 | Parsed and checked locally, not a hosted run           |
| Knowledge repository worktree                                  | Clean; unchanged                                       |
| Real PostgreSQL-backed successful search/RAG                   | Not verified; configured DB unavailable                |
| Live-model evaluation / app mutation / hosted Linux+Windows CI | Not performed                                          |

Local commands: frozen install, formatting, strict typecheck, production build,
unit/API/adapter/snapshot tests, coverage, Chrome browser tests and production dependency audit. The
final command outcomes are reported in the assistant handoff; rerun commands from README to
reproduce. Coverage scope is defined in `vitest.config.ts`, not the whole product.

Real browser checks read the existing graph, every registered record family (including AKL claims),
record details and provenance. Desktop/mobile screenshots are emitted to ignored `test-results/` and
visually inspected. Grounded-answer UI and race/failure regressions use explicit test fixtures; they
are not real-model or DB-runtime evidence.

Local retrieval database at `127.0.0.1:54329` was unavailable. An unrelated PostgreSQL 15 listener
existed on port 5432 and was left untouched. Docker was not found. The app's unavailable-retrieval
path was exercised, not mislabeled as successful search/RAG. Hosted configuration validation is
tested, but an authenticated Neon migration/index and successful hosted retrieval have not yet been
executed in this environment.

No paid model calls, new governed content, lifecycle transitions, kernel modifications, commit,
push, remote creation, PR or hosted CI verification were performed in this run. No app mutation
score is claimed. The included workflow reuses the kernel repository's action major versions;
action-runtime deprecation upgrades remain CI maintenance work.

## Remaining risks and recommended next scope

1. Prepare an explicitly designated local PostgreSQL/pgvector database, index the exact knowledge
   SHA with the fake provider, and prove real app search/answer flows.
2. Publish the new app repository only after choosing its remote; configure read access to the
   sibling kernel, execute both OS jobs and protect main with required checks.
3. Add app-specific mutation tests focused on the transport, snapshot and output boundary.
4. Package the kernel's supported library interface before independent deployment; the current
   sibling-source bridge is intentionally a pilot integration constraint.
5. Authorize and evaluate a real model separately. Do not infer semantic quality, production
   scalability, human decision approval or M7 completion from this pilot.

HTTP result DTOs are TypeScript-owned and explicitly mapped; a fully generated
OpenAPI/response-schema compatibility pipeline is follow-up work. No request cancellation is
propagated through the core provider. No automatic retries of answer requests are enabled.

The engineering objective is enforceable boundaries and traceable evidence, not the unmeasured label
“better than FAANG.” Scalability must be demonstrated with load and corpus-growth measurements
before introducing additional services.
