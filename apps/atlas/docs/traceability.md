# Requirement-to-test traceability

Identifiers below describe **app requirements**, not governed knowledge IDs.

| Requirement                                                     | Implementation                                           | Verification                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| APP-01: public package boundary; no copied corpus               | `architecture-knowledge-system/runtime` workspace export | Build, package export resolution and private-import regressions                              |
| APP-02: inward dependencies                                     | `KnowledgePort`, DTO-only contracts, composition root    | `tests/architecture.test.ts`, including negative boundary probes                             |
| APP-03: versioned traceable responses                           | HTTP envelope and kernel provenance mapping              | `tests/http.test.ts`, `tests/kernel-adapter.test.ts`, browser inspector                      |
| APP-04: evidence and lifecycle not promoted                     | Read-only port, preserved fields, no approval routes     | Adapter lifecycle test; read-only source review                                              |
| APP-05: pinned snapshot and DB integrity before/after retrieval | `snapshot.ts`, adapter `current` and `verifyAfter`       | Startup race, mutation isolation, zero request-time Git calls, stale/tampered DB regressions |
| APP-06: no cross-origin compute or input coercion               | Host/Origin/token guard and strict JSON schemas          | HTTP wrong origin/host/token, extra fields, numeric/blank/oversize inputs                    |
| APP-07: no rejected model draft displayed                       | Kernel RAG complete-packet mapping; answer panel         | Grounding rejection test; browser safe citation/qualifier fixture                            |
| APP-08: operational failure is not an evidence conclusion       | Safe technical errors separate from answer status        | HTTP failure redaction and readiness tests                                                   |
| APP-09: bounded work and graceful degradation                   | Application concurrency, pool limits, graph cap          | Application saturation/release tests, adapter graph cap and DB-unavailable tests             |
| APP-10: browser-safe presentation                               | Plain React text, protocol-checked links, CSP            | Safe URL tests; browser injected-markup fixture; mobile overflow test                        |
| APP-11: ordinary local usability                                | Browse, graph, ask, status, lazy routes                  | Real Chrome flows, static SPA deep-link test, production build                               |

Coverage gates apply to the app API, configuration, application and kernel adapter. They do not
remeasure the entire sibling kernel or prove end-to-end database behavior. The root workflow
includes a DB-backed app HTTP test; local tests explicitly skip without `ATLAS_TEST_DATABASE_URL`.
Hosted success must be checked at the delivered SHA. Existing kernel mutation evidence is not
transferred to new app code.
