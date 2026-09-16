# Structural integration hardening

Status: proposed engineering decision, implementation in progress.
Scope authorized by Ansha Cerbia's "oke gas" following the qualified principal-review
disposition: workspace integration, public kernel boundary, immutable runtime snapshot,
performance measurement and verification. M7.3 runtime and live models remain separate work.

## Principal review provenance and dispositions

The [original review](reviews/principal-architect-assessment.original.txt) is preserved
byte-for-byte as text. Original SHA256:
`cb13f4f0ce45163ac394a72048669b42a566d663730443a042ab09a92586cb21`.
Its relative links describe the original sibling layout. It is an external reviewer
opinion supplied by the owner, not a lifecycle transition or reproducible independent
test report. This implementation and its self-review are not an independent audit.

| Review item | Disposition | Evidence and action |
| --- | --- | --- |
| 4.1 Sibling source coupling | Accepted | Adapter imported kernel private source paths. Atlas now consumes a compiled public package export in one pnpm workspace. |
| 4.1 Two mutually dependent Git repos | Qualified | Kernel does not depend on Atlas; original Atlas folder was not yet a Git repo. Coupling was consumer-to-kernel. |
| 4.2 Per-request Git overhead | Accepted | `assertSnapshot` called `cleanCommit` on reads. Startup-only Git checks now bind a detached snapshot; request regressions enforce zero subsequent Git calls. |
| 4.2 Synchronous subprocess and 30-100 ms cost | Corrected / unverified measurement | Original `promisify(execFile)` was asynchronous. Measure on this machine; do not inherit the review's latency numbers. |
| 4.2 Startup-only validation / manifest shortcut | Qualified | Pin the fully validated records, not just a manifest string. Keep full DB content verification; immutable DB generations with enforceable writer permissions are future work. |
| 4.3 Authoring ossification | Accepted risk, deferred tooling | Pilot corpus size was explicitly bounded. Measure authoring/change lead time before broader corpus; scaffolding and assisted proposed drafts are future work. No automated admission. |
| 4.4 Boolean SAT / false precision | Qualified risk | Existing guides include qualitative criteria, operating-capability context, unknowns and uncertainty. Preserve human authority and require socio-technical context in future runtime; no proof of optimal decisions. |
| 4.5 Radial graph and 40-edge limit | Accepted UX debt, deferred | Current view explicitly promises one-hop inspection. Extend layout/navigation when use cases require it. |
| 4.5 Entire knowledge graph is a DAG | Rejected | Registered symmetric relationships and non-hierarchical edges prevent treating the entire graph as a hierarchy. Hierarchical views may select appropriate predicates. |
| 2.4 Grounding solves hallucination / formal verification praise | Rejected as overstatement | Citation authority, schemas, tests and mutation checks do not prove semantic entailment or formal correctness. |
| 6.1 Monorepo versus published package | Monorepo selected for current scope | Shared release and one local product favor one checkout. Public facade preserves a later extraction path; no claim that all systems require monorepos. |
| 6.3 Graph library replacement | Deferred non-blocker | No layout dependency added solely for appearance. |
| 6.4 Assisted ingestion | Deferred separate scope | Candidate authoring must retain proposed lifecycle, evidence provenance and human review. |
| Phase 3 Calibrated synthesis | Qualified / deferred live evaluation | Synthesis already exists in output contracts. Real-provider semantic quality remains unmeasured; demo output is not proof of full question understanding. |

## Decision, applicability and trade-offs

Keep governed directories and the kernel package at root; put the existing layered
Atlas package in `apps/atlas`. Preserve IDs, record paths and existing kernel commands.
One lockfile and workflow test both packages. `architecture-knowledge-system/runtime`
exports compiled JS and declarations; no private subpath is exported. This facade is
an integration contract, not a guarantee that exposing additional internals is safe.

Applies to the current single-owner, jointly delivered local product. Independently
owned/released consumers should instead use a versioned published package or service.
Costs include a larger install/CI boundary and an explicit kernel build before app use.
The original sibling folder is retained as a rollback copy, not a second active app.
No secret, node_modules, test output or compiled artifact is committed in the migration.

Startup validates a clean commit and all graph/retrieval artifacts, checks the commit
and cleanliness again, clones the complete loaded records, then freezes runtime data.
Artifact serialization Maps remain private construction metadata, not public state.
Endpoint DTOs are detached copies. Source edits after startup do not invalidate the
served snapshot; restart activates a new validated revision. Git is absent from requests.
This is process-local snapshot isolation, not a signed standalone deployment archive.
Startup assumes a trusted local operator and no concurrent writers; two Git checks
cannot rule out edit-and-revert races. Hostile writers require immutable release inputs.

The database generation is still bound to the pinned SHA, embedding contract and
full content manifest. Full checks before and after retrieval retain same-generation
tamper detection; metadata-only cache checks would weaken this boundary. DB checks
remain a scalability cost and do not create a serializable transaction across writers.
Use read-only runtime connections, separate indexing and controlled activation.

Security/privacy boundaries remain loopback, server-only credentials, no request-body
logging, bounded requests and no live model egress. No content lifecycle is elevated.
Graph availability is independent of DB availability. Generation changes discard an
in-flight answer. Snapshot data is not live: users must inspect SHA provenance and restart
after planned knowledge changes. Under the existing exact-commit policy, even a
docs-only commit requires reindexing for Search/Ask; no schema migration is required.

## Verification and measurement plan

- Workspace frozen install, compiled build and package export/private-import checks.
- Kernel validation, graph/retrieval currentness, integrity reports and existing tests.
- App coverage, mutation isolation, startup races, missing/stale/tampered DB and generation-change regressions.
- Browser tests on the actual app; separate opted-in PostgreSQL HTTP retrieval test.
- Linux/Windows Atlas CI plus existing kernel CI and Linux PostgreSQL integration.
- Informational catalog benchmark with/without former Git guard, serial and concurrent;
  optional DB measurements explicitly separate network/content-check costs.

Results and limitations will be recorded after execution. No hosted success is inferred
from workflow configuration. M7.3 follows hardening verification and a bounded runtime scope.
