# Final Independent M6 V4 Re-Audit — M6-AUD-009 Exit Decision

## Final decision

**M6 READY**

M6-AUD-009 is **closed** at exact commit
`4f032f15e34c3f69039b7d010563ba656ecda947`.

The official evaluator module now issues governed evidence classification only
after its loader successfully validates both registered repository artifacts
and stores a module-private attestation for that exact returned object. The
attestation cannot be recreated with a public property, symbol, structural
copy, clone, serialization round-trip, proxy, mixed artifact pair, or passing
metric result. The evaluator verifies the complete attested parsed content on
an isolated snapshot before provider invocation and reads that snapshot for the
entire run.

Independent adversarial probes reproduced the original M6-AUD-009 exploit and
all required authority-transfer, path, mutation, and time-of-check/time-of-use
attacks. The former version-999/public-marker fixture passed every metric gate
but remained `synthetic ungoverned evaluator fixture`. No unresolved Critical,
High, or blocking Medium finding remains.

This result clears the technical M6 exit gate. It does not start M7, approve a
decision, change lifecycle state, or substitute for the explicit human
authorization required to enter M7.

## Audit identity and provenance

| Item | Independently verified value |
| --- | --- |
| Repository root | `D:/Ansha/architecture-description/architecture-knowledge` |
| Remote | `https://github.com/anshacerbia2/architecture-knowledge.git` |
| Required branch | `main` |
| Required and audited SHA | `4f032f15e34c3f69039b7d010563ba656ecda947` |
| Local `HEAD` | Exact match |
| Local `origin/main` | Exact match |
| Live remote `refs/heads/main` | Exact match through `git ls-remote` |
| Initial worktree | Clean: `## main...origin/main` |
| Remote remediation branch | `refs/heads/m6-focused-remediation-v4` absent |
| Audit date | 2026-09-01, Asia/Jakarta |

There was no provenance mismatch, so the substantive audit proceeded. The
worktree remained clean until this report was created.

### PR and merge lineage

Public GitHub metadata and the local commit graph establish this lineage:

| PR | Direction and result | Merge commit | Relevant head/base |
| --- | --- | --- | --- |
| [#4](https://github.com/anshacerbia2/architecture-knowledge/pull/4) | `m6-focused-remediation-v4` into `main`; merged | `53602a7171ab77fa7947ae979504bc76c3dff849` | head `a4b3ee564b5ee880e9471d7c7545c8be37c497d3`; base `827afde7f135387b1f10dc7faef3d4ec7eaea9fd` |
| [#5](https://github.com/anshacerbia2/architecture-knowledge/pull/5) | `main` back into `m6-focused-remediation-v4`; merged | `aa255afdb7c9e1ec33b54d2a6d636831d9833971` | head `53602a7171ab77fa7947ae979504bc76c3dff849`; base `a4b3ee564b5ee880e9471d7c7545c8be37c497d3` |
| [#6](https://github.com/anshacerbia2/architecture-knowledge/pull/6) | round-tripped branch into `main`; merged | audited SHA `4f032f15e34c3f69039b7d010563ba656ecda947` | head `aa255afdb7c9e1ec33b54d2a6d636831d9833971`; base `53602a7171ab77fa7947ae979504bc76c3dff849` |

The remediation commit, all three merge commits, and the audited commit have
the identical tree `b4d7feac5d2ec0d14769c1d61204272be4c49bc1`.
`git diff 53602a7..4f032f1` is empty. The additional merge round-trip therefore
introduced no content divergence.

## Scope and reviewed evidence

This was an audit-only review. Existing audit and remediation reports were
treated as claims, then checked against the exact merge diff, current source,
schemas, registered artifacts, tests, direct commands, temporary adversarial
probes, and hosted metadata.

The review included:

- `src/rag-evaluation.ts` and `tests/rag-evaluation.test.ts`;
- `evaluation/rag-golden.yaml` and `evaluation/rag-case-contracts.yaml`;
- `schemas/rag-evaluation.schema.json`, `schemas/registry.json`, and schema
  regression tests;
- the V3 independent report and V4 remediation report;
- ADR 0007, the M6 architecture guide, README/roadmap state, and
  `roadmap/implementation.yaml`;
- `.github/workflows/validate.yml`, `package.json`, `vitest.config.ts`, and
  `stryker.rag.config.json`; and
- provider, engine, context, request, output-contract, and CLI boundaries for
  benchmark-specific behavior or M7 leakage.

The committed evaluation inventory is version 3/status `draft`, 23 benchmark
cases, 8 holdout cases, and 8 embedded governed contracts: 2
`natural-no-answer` and 6 `adversarial-safety`. Both artifacts remain registered
under schema registry version 3. They are evaluation infrastructure, not
reviewed or canonical architecture knowledge.

## Architecture and trust-boundary assessment

### Capability construction

`RagBenchmark` no longer exposes `contract_registry_version` or another public
provenance field. Runtime module exports are only `loadRagGolden` and
`evaluateRag`; the `WeakMap`, registered paths, fingerprint function, and
pair-check function are not exported.

Successful loading creates a plain benchmark object after envelope, corpus,
contract-registry, contract-policy, and one-to-one obligation validation. The
private `WeakMap` stores a fingerprint only when both resolved input paths equal
the module's registered benchmark and contract paths. Object identity is the
capability key. A structurally identical object has no entry.

At evaluation entry the official module:

1. retrieves the attestation by exact object identity;
2. clones the object;
3. fingerprints the clone and compares it with the stored value;
4. revalidates corpus structure and every embedded contract binding; and
5. evaluates, scores, partitions, and reports only from that isolated clone.

No provider callback runs if fingerprint or contract validation fails.

### Fingerprint completeness

The fingerprint serializes the parsed benchmark version, status, complete case
array, every case field, filters, holdout metadata, and each attached contract
with all obligations. Field-by-field mutation probes independently confirmed
coverage of version, status, ordinary and governed questions, case ID,
category, filters, holdout, accepted statuses, invocation requirement,
expected/forbidden claims, epistemic requirements, prohibited terms, embedded
contracts, contract removal, and case addition/deletion/reordering.

Benchmark and registry prose notes are not part of the runtime benchmark object
or scoring input. The required runtime-relevant parsed content is covered.

### Authority scope

The capability is private to one trusted module instance. A query-qualified
second instance created its own private map: each instance recognized only
objects loaded by itself, and cross-instance objects were synthetic. Changing
the process working directory did not change the module's registered root.

An additional boundary probe relocated an exact source copy plus adjacent
altered evaluation artifacts into a temporary module root. That distinct module
issued its own `contract-registry-validated` string because its constants are
derived from its own `import.meta.url`. This is not authority transfer from the
official exact-SHA module: it is selection of a different executable/module
trust root. Code capable of choosing or replacing the evaluator implementation
can also fabricate a report directly. Therefore the evidence-class string is
not cryptographic remote attestation and must be accepted only from a trusted
exact-SHA execution of the official module. This is recorded as
M6-V4-OBS-001, not as an in-process official-module bypass.

Repository or executable write authority, replacement of the registered files
at their exact paths, and coordinated source/policy edits remain controlled by
Git review and exact-SHA CI evidence, outside the object-capability boundary.

## Independent adversarial probes

All probe programs and artifact copies were confined to a uniquely named
operating-system temporary directory. No committed artifact was modified.

### A. Original M6-AUD-009 exploit

A programmatic object used version `999`, status `synthetic-programmatic`, all
eight copied embedded contracts, 15 replaced ordinary questions, and the former
`contract_registry_version: 1` marker. Provider packets satisfied every gate.

Result: all gates passed, reported version/status remained the synthetic
values, and the evidence class was exactly the synthetic ungoverned class. It
did not contain `contract-registry-validated`.

### B. Authority-transfer attacks

| Attack | Gate result | Evidence class |
| --- | --- | --- |
| Spread copy | Passed | Synthetic |
| `structuredClone` | Passed | Synthetic |
| JSON serialization round-trip | Passed | Synthetic |
| Reconstructed structurally identical object | Passed | Synthetic |
| New wrapper with copied cases and contracts | Passed | Synthetic |
| Proxy around the attested object | Passed | Synthetic |
| Caller-created symbol marker | Passed | Synthetic |

Passing gates did not confer authority in any case.

### C. Artifact-path attacks

| Input pair | Result |
| --- | --- |
| Valid benchmark and contract copies | Synthetic |
| Registered benchmark plus copied contracts | Synthetic |
| Copied benchmark plus registered contracts | Synthetic |
| Copies loaded after changing the working directory | Synthetic |
| Junction alias to the registered evaluation directory | Synthetic |
| Windows case-variant paths to the same physical files | Synthetic safe false negative |
| Relative registered paths from repository root | Governed; they normalize to the exact registered pair |
| Registered paths containing `evaluation/../evaluation` | Governed; they normalize to the exact registered pair |

The two governed alias cases name the same registered artifacts after normal
path normalization; they are not unregistered pairs. The case-variant and
junction results lose authority rather than escalate it.

### D. Integrity attacks before evaluation

Nineteen independent post-load mutations were executed: version, status,
ordinary question, governed question, case ID, category, filters, holdout,
acceptable statuses, invocation requirement, expected claims, forbidden
claims, epistemic requirements, prohibited terms, embedded contract, contract
removal, case addition, case deletion, and case reordering.

Every mutation failed with
`RAG_EVALUATION_CONTRACT governed benchmark integrity mismatch`. Provider
callback count was zero for every probe.

### E. Mid-run mutation and TOCTOU attacks

From the first provider callback the probe changed the original version,
status, case ordering and length, current and future question/category/filter
data, holdout values, accepted statuses, expected/forbidden claims, epistemic
requirements, prohibited terms, and embedded scoring obligations.

Evaluation still made 23 calls against the pristine isolated snapshot. The
complete report was byte-for-byte equal to the pristine evaluation report:
version 3, status `draft`, 23 cases, governed evidence class, and all gates
passed. Callback-time mutation could not affect remaining cases, scoring,
partitions, gate results, identity, or classification.

### F. Loader and trust-boundary attacks

- Arbitrary but schema-valid copied files loaded successfully but stayed
  synthetic.
- Alternate and mixed contract paths stayed synthetic.
- Working-directory changes did not redefine the official module root.
- A second instance of the same official module had a distinct private
  attestation map; authority did not transfer in either direction.
- Relocating the evaluator implementation creates a different executable trust
  root, as recorded in M6-V4-OBS-001.
- Mutation of the committed registered files during loading was not attempted
  because the audit forbids repository modification. Such an attack requires
  repository write authority and belongs to Git/exact-SHA and filesystem
  integrity controls, not ordinary evaluator input authority.

### Original M6-AUD-004 and benchmark gaming

The original RAG-018 category/no-answer relaxation was independently recreated
in temporary copies. Loading failed with
`RAG_EVALUATION_CONTRACT category mismatch RAG-018`; provider callback count
was zero. M6-AUD-004 remains closed and superseded by the now-closed
M6-AUD-009.

Coordinated benchmark, contract-registry, schema, validator, and test changes
could redefine evaluation policy while making CI pass. That is a visible
source-governance and exact-SHA review risk, not a reusable evaluator input
bypass. The contract registry remains draft and policy changes require explicit
review; runtime attestation cannot determine whether an authorized policy
change is substantively good.

The V4 diff does not change provider, engine, context, request, or output
contract code. A direct search found no benchmark case IDs, expected question
literals, hostile phrases, or benchmark-specific classification behavior in
those files.

## Exact-SHA hosted workflow evidence

The immutable hosted workflow is [GitHub Actions run 33423912682](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/33423912682),
displayed as run `#34`. Public API metadata records attempt 1, event `push`,
branch `main`, exact head SHA
`4f032f15e34c3f69039b7d010563ba656ecda947`, status `completed`, and conclusion
`success`. It ran from 2026-08-31T18:14:28Z to 2026-08-31T18:47:44Z.

| Required job | Job ID | Conclusion | Independently visible successful steps |
| --- | ---: | --- | --- |
| `validate (ubuntu-latest)` | 99592721001 | success | checkout, pnpm/Node setup, locked install, format, full validation, graph and retrieval currentness, unit/regression tests, coverage, integrity currentness |
| `retrieval-integration` | 99592721239 | success | container initialization, checkout, locked install, migration, deterministic indexing, currentness, active PostgreSQL integration tests, retrieval evaluation, governed RAG evaluation, benchmark, hybrid query, governed answer smoke |
| `validate (windows-latest)` | 99592721392 | success | the same cross-platform validation/test/coverage/currentness boundary |
| `mutation` | 99592721400 | success | full, focused graph, focused retrieval, and focused RAG mutation stages |

Each job's public API step records is `completed/success`; no required step was
skipped. The public job HTML independently exposed the same step names and
passed state.

Raw console-log downloads were not available to this audit session: GitHub's
job-log API returned HTTP 403 with `Must have admin rights to Repository`, the
logged-out HTML log fragments returned `Not Found`, and no in-app browser was
available. Therefore this report does not claim line-level hosted metrics or
repeat implementation-report numbers as hosted proof. Exact-SHA hosted
execution is supported by immutable run/job/step metadata and independently
audited workflow commands; exact numeric quality results below are from local
execution of the same SHA.

All four jobs have one warning annotation. GitHub reports that
`actions/checkout@v4`, `actions/setup-node@v4`, and `pnpm/action-setup@v4`
target Node.js 20 and are being forced onto Node.js 24. The actions completed
successfully, so this remains M6-AUD-008 maintenance debt rather than a
functional or security blocker.

## Local commands and exact results

All package operations used pnpm.

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; lockfile current. Existing ignored `esbuild` build-script warning and pnpm update notice recorded. |
| `pnpm format:check` | Passed. |
| `pnpm validate` | Passed: typecheck plus schema, vocabulary, IDs, sources, claims, relationships, lifecycle, Markdown, and links; 0 errors, 0 warnings. |
| `pnpm validate:schema` | Passed: 0 errors, 0 warnings. |
| `pnpm validate:markdown` | Passed: 0 errors, 0 warnings. |
| `pnpm validate:links` | Passed: 0 errors, 0 warnings. |
| `pnpm graph:check` | Passed: 12/12 current. |
| `pnpm retrieval:units:check` | Passed: 2/2 current. |
| `pnpm report:integrity` after report creation | Passed: wrote 12 deterministic reports; only the Markdown/link inventory changed. |
| `pnpm report:check` before and after report regeneration | Passed: 12/12 current on both runs. |
| `pnpm test` | Passed: 33 files passed, 1 PostgreSQL-conditional file skipped; 440 tests passed and 4 PostgreSQL-conditional tests skipped. |
| `pnpm test:coverage` | Passed: 92.11% statements, 82.67% branches, 95.61% functions, 94.70% lines. `rag-evaluation.ts` reached 90.83% statements and 87.17% branches. |
| `pnpm test:mutation:rag` | Passed in 6m59s: 75.46% total/76.48% covered; 903 killed, 1 timeout, 278 survived, 16 no coverage, 0 errors. `rag-evaluation.ts`: 71.95%, 313 killed, 122 survived, 0 no coverage. |
| Independent TSX adversarial probes | Passed the required authority, path, integrity, TOCTOU, module-instance, and M6-AUD-004 assertions. |
| `docker version` availability check | Docker command unavailable; no local PostgreSQL/pgvector execution was represented as passing. |

## Finding disposition matrix

| Finding | Current severity | Final disposition | Independent basis |
| --- | --- | --- | --- |
| M6-AUD-001 — raw citation versus final resolved-citation grounding | — | **closed** | V4 does not alter the citation boundary; governed source admission, record authorization, canonical metadata resolution, and final-catalog grounding remain covered by tests and mutation. |
| M6-AUD-002 — complete prompt-visible context fingerprint integrity | — | **closed** | V4 does not alter context construction; all prompt-visible evidence, request controls, citation catalog, graph provenance, and generation identity remain fingerprinted. |
| M6-AUD-003 — reusable engine and external-provider classification enforcement | — | **closed** | V4 does not alter classification enforcement. Engine/provider gates remain fail closed before the external fetch boundary. |
| M6-AUD-004 — evaluation credibility and resistance to benchmark-category gaming | — | **superseded by M6-AUD-009; original exploit closed** | The original category/no-answer exploit again failed before provider invocation. V3's replacement provenance issue is resolved below. |
| M6-AUD-005 — model identifier reproducibility boundary | Observation | **accepted bounded risk** | `gpt-5.6-sol` remains a concrete routing identifier rather than an immutable dated model snapshot; documentation states the limit. |
| M6-AUD-006 — application output bounds and mutation assurance | — | **closed** | No regression; unit, boundary, coverage, and focused RAG mutation gates pass. |
| M6-AUD-007 — structural grounding versus semantic entailment limitation | Observation | **accepted bounded risk** | Documentation continues to state that structural grounding does not prove prose entailment or real-provider answer quality. |
| M6-AUD-008 — GitHub Actions runtime-maintenance annotations | Observation | **deferred non-blocker** | Four Node.js 20 deprecation annotations remain; forced Node.js 24 execution completed every required step. |
| M6-AUD-009 — forgeable contract-registry evidence classification | — | **closed** | Direct programmatic spoof, public marker/symbol, structural copy, clone, serialization, proxy, copied/mixed artifacts, and pre/mid-run mutation could not transfer or recreate the official module's private attestation. |
| M6-V4-OBS-001 — module-origin and remote-attestation boundary | Observation | **accepted bounded risk** | A relocated evaluator implementation creates a different module-relative trust root. Evidence reports must come from a trusted exact-SHA official-module execution; the evidence-class string is not cryptographic remote attestation. This does not transfer or forge authority inside the official instance. |

## Finding counts

Counts exclude closed and superseded findings.

| Critical | High | Medium | Low | Observation |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0 | 0 | 0 | 4 |

The observations are M6-AUD-005, M6-AUD-007, M6-AUD-008, and
M6-V4-OBS-001. None is a blocking Medium.

## Residual risks and evidence limits

- Evaluation reports require trusted executable/module origin and exact-SHA
  provenance; their classification string is not independently signed.
- A party with repository or executable write authority can replace the
  registered artifacts or implementation. Git review, branch protection, and
  exact-SHA execution—not the in-process `WeakMap`—control that boundary.
- Coordinated policy edits remain visible review-governance risk. Runtime
  validation establishes consistency, not the substantive quality of an
  authorized policy change.
- The deterministic provider and committed holdout remain functional and
  adversarial-regression evidence, not secret-holdout or real-provider semantic
  quality, prompt-injection robustness, calibration, latency, or cost evidence.
- Structural grounding does not prove semantic entailment.
- The configured model routing identifier is not an immutable model snapshot.
- Local PostgreSQL/pgvector execution was unavailable because Docker was not
  installed. Exact-SHA hosted step metadata verifies the database boundary ran
  successfully, but raw hosted console lines were inaccessible as described.
- The four GitHub action-runtime maintenance annotations remain.

No live or paid external model was invoked during this audit.

## Files changed by this audit

- `docs/m6-final-independent-reaudit-v4-report.md` — this independent report;
- `generated/integrity/markdown-link-integrity.json` — regenerated
  deterministically only to account for the new Markdown inventory.

No implementation, schema, evaluation policy, governed knowledge, claim,
relationship, source, ontology, lifecycle, or M7 file was changed.

## M6 and M7 entry decision

**M6 READY**

M6-AUD-009 is closed, exact-SHA local and hosted provenance is sufficient, all
required local non-database gates pass, and no unresolved Critical, High, or
blocking Medium finding remains.

M7 is technically eligible for a separate, explicitly authorized entry
decision. This audit does not grant human approval, begin M7, create an M7
artifact, or modify its `future` lifecycle status.
