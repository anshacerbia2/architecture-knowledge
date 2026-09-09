# M7.2 Corpus Pilot Implementation Handoff

Date: 2026-09-09. Base: `d8dfe281d744f2fb03cc78b42fee48eb8a16aa8a`.
Scope authorization: the owner's continuation after the bounded M7.2 pilot
proposal. This is an implementation report, not an independent audit or human
content approval. M7 as a whole is not complete.

## Changes

- Three proposed guide records AKG-000001 through AKG-000003 under `decisions/`.
- Thirteen support claims AKL-000070 through AKL-000082; twelve existing claims
  gain source locators and incremented versions without statement/state changes.
- Sixteen ledger allocations and twenty-six automated evidence lifecycle events.
- Eight existing concept files gain claim references and update/version metadata.
- Pilot authoring instructions, catalog/source-fidelity analysis, this report,
  roadmap/navigation alignment, and production-corpus regression tests.
- Graph, retrieval, and integrity outputs regenerated through their generators.
- Retrieval count assertions now track the loaded corpus, with the pilot's
  exact 82-claim/3-guide inventory asserted in its own regression test.
- The graph fixture now appends its synthetic guide without deleting real
  guides from the family list. The production provenance count is explicitly
  updated from 237 to 308; the 24 relationship records and 31 adjacency entries
  in each direction are unchanged.

No validator, schema, ontology registry, relationship record, provider adapter,
runtime, CI configuration, or benchmark threshold is changed. No new concepts
or sources are allocated. The previously untracked second-reviewer report is
preserved; its inventory entry remains in the regenerated Markdown report.

## Architectural decisions and unresolved alternatives

See the [catalog and source-fidelity matrix](m7-2-corpus-pilot.md).

- Use immutable guide IDs plus a title catalog now; a mandatory guide-key
  migration remains a deliberate pre-expansion decision, not a hidden alias.
- Distinguish deployment alternatives, complementary controls, and inquiry
  lenses. Narrow the latter to a service-availability inquiry.
- Keep unmeasured trade-offs unknown and selection judgments low-confidence.
- Retain edge-local applicability instead of inventing reusable concepts.
- Scope the existing generic Constraint node explicitly. Multi-constraint
  project modeling is a known limitation, not evidence of constraint completeness.
- Preserve source admission, claim sourcing, guide lifecycle, and project
  decision authority as separate states.

Residual risks: same-author content judgment, limited corpus diversity,
living-source revision drift, unmeasured database ranking effects, no real-user
sessions, and no real-provider semantic-quality evidence. Security/data/operations
questions are prompts for further evidence, not certified design controls.

## Validation

Final local result: implementation and local validation complete; exact-change
hosted CI and database ranking evidence remain pending. This is not a blanket
M7.2 completion approval or runtime-entry clearance.

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed in the existing workspace; esbuild build-script approval warning retained, no policy change |
| `pnpm format:check` | Passed |
| `pnpm validate` | Passed, 0 errors and 0 warnings across all gates, including typecheck |
| `pnpm test:coverage` | 594 passed, 4 DB tests skipped; 43 test files passed, 1 skipped |
| Coverage gates | Passed: statements 93.11%, branches 84.35%, functions 96.38%, lines 95.36% |
| Pilot tests | 20 passed, including actual availability-driver evidence closure |
| `pnpm graph:check` | 13/13 current |
| `pnpm retrieval:units:check` | 2/2 current |
| `pnpm report:check` | 13/13 current |
| `graph:query -- get AKG-000001` | Passed, resolved the guide |
| `graph:query -- evidence AKL-000075` | Passed, preserved parent 000027 and source 000013 |
| Existing-record semantic diff | 20 records checked; statements, conditions, epistemic types and lifecycle states preserved |
| `git diff --check` | Passed; existing CRLF-to-LF informational notices only |
| Local mutation | Not rerun: no validator/executable production logic changed; no new score claimed |
| Exact-change hosted jobs | Not run in this uncommitted handoff; existing Linux/Windows, mutation and DB gates retained |

The initial full suite found two stale test assumptions (zero production guides
and the old fixed provenance count). Both were corrected as described above;
the final full coverage suite passed without reducing any threshold. A draft
documentation example incorrectly used an AKG ID with the claim-only evidence
command; it was corrected and both final CLI examples were executed successfully.

Local PostgreSQL/pgvector at `127.0.0.1:54329` returned no response; Docker is not
available. Consequently no local database retrieval/RAG benchmark or PostgreSQL
integration success is claimed for this content change. Prior M7.1 hosted
success is not exact-change evidence for this pilot.

## Next run

Review the three guide judgments and the bounded lookup/constraint decisions,
then use a separately requested commit/PR to obtain exact-change Linux, Windows,
mutation, PostgreSQL, retrieval-evaluation, and RAG-evaluation evidence. Do not
lower benchmark gates to accommodate corpus growth. Address any measured
retrieval regression before wider authoring or runtime work. No commit, push,
PR, merge, branch deletion, or next runtime phase is performed by this run.
