# Independent M6 Architecture RAG Audit

Audit date: 2026-08-21
Auditor role: independent architecture, RAG, ontology/governance, application-security, and adversarial-test review
Repository: `https://github.com/anshacerbia2/architecture-knowledge`
Branch: `main`
Audited SHA: `aedba37a5aa4d479d47f1e65b24d0623d8a34b13`
Implementation commit: `feat: implement governed architecture RAG`

## Executive verdict

The provenance precondition passed: local `HEAD`, local `origin/main`, the remote
`main` ref, and GitHub Actions run 31705024553 all identify the required SHA.
The exact-SHA Linux, Windows, mutation, and PostgreSQL/pgvector jobs succeeded,
and their logs show the expected migration, indexing, currentness, retrieval,
evaluation, and RAG smoke steps actually ran.

M6 nevertheless is not safe to clear for M7. An application-level citation
integrity bypass permits an assertive `answered` statement to pass grounding
while its final answer contains no application-resolved citation
(M6-AUD-001, High). Material evidence text and title are not bound by the
context fingerprint (M6-AUD-002, Medium). The external-data classification
policy is enforced only in the CLI composition root, not at the reusable engine
or provider boundary (M6-AUD-003, Medium). The deterministic evaluation can be
gamed by exact IDs and impossible filters and does not provide a credible
prompt-injection or natural no-answer clearance (M6-AUD-004, Medium).

Finding count: 0 Critical, 1 High, 3 Medium, 2 Low, and 2 Observations. The High
finding and all three Medium findings block M7.

## Scope and method

This was an audit-only run. No implementation, schema, contract, source, claim,
relationship, knowledge, lifecycle, M7, or generated file was changed. No paid
or external model provider was invoked. Targeted adversarial probes used the
repository's deterministic provider or local mock `fetch` functions and did not
write test files.

The review included the required repository documents and configuration, all
ten `src/rag-*.ts` files, all six `tests/rag-*.ts` files, and the consumed M5
retrieval request, packet, query, currentness, artifact, graph, and database
contracts. Implementation reports were treated as assertions to corroborate,
not as evidence by themselves.

## Local and hosted provenance

### Local provenance

| Check | Observed result | Disposition |
| --- | --- | --- |
| Repository root | `D:/Ansha/architecture-description/architecture-knowledge` | Verified |
| Branch | `main` | Verified |
| Origin URL | `https://github.com/anshacerbia2/architecture-knowledge.git` | Verified |
| Worktree before report | Clean, `main...origin/main` | Verified |
| Local `HEAD` | `aedba37a5aa4d479d47f1e65b24d0623d8a34b13` | Verified |
| Local `origin/main` | Same required SHA | Verified |
| Remote `refs/heads/main` | Same required SHA via `git ls-remote` | Verified |
| Commit subject | `feat: implement governed architecture RAG` | Verified |

There was no provenance mismatch, so the substantive audit proceeded.

### Hosted provenance

The immutable workflow is [GitHub Actions run 31705024553](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/31705024553),
display run `#22`, attempt 1, event `push`, created at
`2026-08-13T13:27:42Z`, completed at `2026-08-13T14:10:25Z`, with head SHA
`aedba37a5aa4d479d47f1e65b24d0623d8a34b13` and conclusion `success`.

| Expected job | Immutable job ID | Conclusion | Log evidence inspected |
| --- | ---: | --- | --- |
| `validate (ubuntu-latest)` | [94463298234](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/31705024553/job/94463298234) | Success | Checkout SHA, install, format, validators, reports, tests, coverage |
| `validate (windows-latest)` | [94463298264](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/31705024553/job/94463298264) | Success | Checkout SHA, install, format, validators, reports, tests, coverage |
| `mutation` | [94463298291](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/31705024553/job/94463298291) | Success | Legacy/focused gates including `pnpm test:mutation:rag` |
| `retrieval-integration` | [94463298391](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/31705024553/job/94463298391) | Success | pgvector service, migration, index, currentness, integration, evaluations, smoke answer |

The retrieval-integration logs establish the following exact-SHA execution,
rather than merely a green workflow summary:

- `pgvector/pgvector:0.8.2-pg16-bookworm` was started and became healthy.
- `pnpm retrieval:migrate` applied one migration.
- indexing created generation `rg:sha256:683d6a78d91ab895e63c56b30` and recorded
  the required repository commit;
- the currentness check matched that generation and repository commit;
- two PostgreSQL integration files ran 15 tests, including active-generation,
  malformed-embedding, row-tampering, and generation-tampering cases;
- retrieval evaluation passed, retrieval benchmarking ran, and a hybrid query
  smoke ran;
- RAG evaluation passed all configured functional gates, and the governed RAG
  smoke returned an `answered` packet with provenance and citations;
- the focused RAG mutation command ran 55 dry-run tests and passed its 60%
  threshold with a 71.47% total mutation score.

This evidence is tied to run 31705024553 and the required SHA. No later rerun or
current branch-head result was substituted.

Each of the four jobs emitted one GitHub Actions Node.js 20 deprecation
annotation for JavaScript action dependencies. This is recorded as
M6-AUD-008, a maintenance observation: the jobs used the forced Node.js 24
runtime and passed, so the annotation is not evidence of an M6 functional
failure.

## Command execution matrix

All package operations used pnpm.

| Command or check | Local result | Hosted exact-SHA corroboration |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | Pass; lockfile current. pnpm warned that an `esbuild` build script was ignored. | Pass in all jobs |
| `pnpm format:check` | Pass | Pass on Ubuntu and Windows |
| `pnpm validate` | Pass; 0 errors, 0 warnings | Pass on Ubuntu and Windows |
| `pnpm graph:check` | Pass; 12/12 artifacts current | Pass |
| `pnpm retrieval:units:check` | Pass; 2/2 artifacts current | Pass |
| `pnpm report:check` | Pass; 12/12 reports current | Pass |
| `pnpm test` | Pass; 32 files, 1 skipped; 368 passed, 4 skipped | 368 passed and 4 skipped in each cross-platform validation job |
| `pnpm test:coverage` | Pass; 91.91% statements, 81.73% branches, 95.14% functions, 94.70% lines | Same values on Ubuntu and Windows |
| `pnpm test:mutation:rag` | Pass; 71.47% total, 73.05% covered, 496 killed, 183 survived, 15 no coverage, 0 errors/timeouts | Same score and threshold pass |
| Inline context/citation probe | Reproduced M6-AUD-001 and M6-AUD-002 | Not part of hosted suite |
| Inline HTTP boundary probe | Expected bounded behavior for 400, 401, 403, 408, 409, 429, 500, timeout, and network failure | Partially covered by hosted unit tests |
| Inline semantic/output probe | Opposite meaning, uncertainty-only `answered`, and 100,000-character text accepted structurally | Not part of hosted suite |

The first local attempt to run process-spawning checks inside the restricted
sandbox encountered `spawn EPERM`; each required check was rerun directly with
the necessary execution permission and passed. This infrastructure event is not
reported as a product failure.

The four locally skipped tests are the PostgreSQL integration tests guarded by
the absence of a local integration database. They are not concealed: the
exact-SHA hosted pgvector job ran the corresponding integration suites and all
15 tests passed.

## Architecture and contract assessment

### Verified controls

- Request parsing rejects unknown keys and bounds normalized question length,
  context list sizes and item lengths, retrieval budgets, statement count, and
  requested output tokens. Retrieval text is overwritten from the normalized
  question. Recommendation permission requires meaningful project context.
- The production CLI loads expected M5 artifacts, checks the repository commit,
  embedding contract and active generation through `checkRetrievalCurrent`, and
  loads the validated graph before constructing the retrieval engine.
- Degraded retrieval is explicit in the M5 packet; lexical fallback is disabled
  by the M6 default request. Empty evidence returns `insufficient-evidence`
  without calling the model.
- M4 graph traversal policy remains in the M5 engine: only registered,
  traversable relationship edges are followed and the excluded relationship
  remains denied. M6 consumes the resulting bounded M5 packet and does not add
  another traversal mechanism.
- Evidence and citation IDs are deterministic for a fixed result order, graph
  values use deterministic serialization, and final citation metadata is
  selected by application code from the context catalog rather than accepted
  from model output.
- The output parser enforces an exact object shape, required fields,
  `additionalProperties: false` in both schema and application parser, unique
  `Sdddd` statement IDs, status invariants, epistemic/confidence enums,
  nonempty/duplicate-free string arrays, and a global/request statement cap.
- Unknown/dangling evidence and claims, malformed claim IDs, sourced claims
  backed only by non-claim units, single-evidence synthesis, high-confidence
  inference/recommendation, high-confidence uncertainty, and unrequested or
  incompletely framed recommendations are rejected structurally.
- Refusal, incomplete response, malformed model JSON, missing model output, and
  returned-model mismatch fail with distinct stable errors. Only an explicit
  provider refusal becomes an answer packet with status `refused`; arbitrary
  failures are not converted to refusal.
- The production request uses the Responses endpoint, `text.format` with strict
  JSON Schema, `store: false`, and a bounded `max_output_tokens`. This shape is
  consistent with the current official [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs)
  and [Responses API reference](https://developers.openai.com/api/reference/resources/responses/methods/create).
- API keys enter only through environment-derived provider construction and the
  authorization header. The implementation does not log or persist request or
  response bodies. No external model was called during this audit.
- HTTP 400/401/403 were terminal in the direct probe. HTTP 408/409/429/500 and
  a network exception retried up to the configured attempt bound. Timeout became
  `RAG_MODEL_UNAVAILABLE AbortError`, not refusal. Backoff and timeout are
  bounded, although the adapter does not honor `Retry-After`.
- The deterministic and production evidence classes are named distinctly. The
  evaluation report explicitly says the fake benchmark is not real-provider
  semantic-quality evidence.
- M6 does not create architectural drivers, candidate options, approvals, ADRs,
  memory, feedback learning, corpus mutations, or lifecycle transitions. Its
  recommendation is a bounded answer type requiring an explicit request and
  project context; it is not an automated approval mechanism.

### Failed controls

- Citation presence is validated against raw retrieval citations while final
  citations are resolved from a stricter catalog. Those two definitions of
  resolvability diverge and allow an uncited assertive answer (M6-AUD-001).
- The context fingerprint trusts `content_hash` without verifying it against
  the copied text and omits other material evidence fields. It therefore does
  not detect material packet tampering (M6-AUD-002).
- Data classification is not part of the request/context/provider call and is
  not rechecked inside `RagEngine.answer` or `OpenAIRagProvider.generate`.
  Direct reuse can bypass the CLI-only guard (M6-AUD-003).
- The functional benchmark does not expose the model to its sole adversarial
  prompt and does not realistically test no-answer behavior (M6-AUD-004).

### Structured grounding versus semantic entailment

The validator proves identifier existence, structural citation presence,
epistemic-label-specific shape rules, and confidence/recommendation constraints.
It does not prove that statement prose is entailed by evidence. A direct probe
changed a valid sourced statement to say that its evidence meant the exact
opposite and mandated ADR approval; grounding returned no diagnostic. Another
probe used an `uncertainty` label with no evidence in an `answered` packet; it
also passed.

This limitation is accurately disclosed in ADR 0007 lines 55-58, the M6 guide
lines 122-126, and the implementation report lines 100-103. It is acceptable as
an explicitly bounded M6 structural-grounding limitation, not as semantic
quality evidence. It is not acceptable to represent the current benchmark as
proof that injected, broadened, exception-dropping, normative, or
opposite-meaning prose is prevented. M7 requires representative real-provider
and human semantic evaluation before decision-support advice can rely on these
outputs.

## Adversarial-test matrix

| Attack or boundary | Evidence used | Result |
| --- | --- | --- |
| Unknown request fields | Existing request/CLI tests and parser review | Rejected |
| Divergent retrieval text | Parser and context tests | Normalized question is authoritative; mismatch rejected |
| Empty retrieval | Engine test and hosted smoke paths | Model not called; explicit insufficient evidence |
| Stale/tampered active M5 generation | Currentness and hosted PostgreSQL tamper tests | Production CLI fails before answer generation |
| Material evidence title/text changed with old hash | Inline tsx probe | **Bypass:** fingerprint remained exactly equal; M6-AUD-002 |
| Unknown evidence ID | Unit test | Rejected with dangling-evidence diagnostic |
| Unknown/malformed/unrelated claim ID | Unit tests and code review | Rejected |
| Citation with null title and URL | Inline tsx probe | **Bypass:** grounding passed, status `answered`, final citations 0; M6-AUD-001 |
| Model-authored URL/source ID | Contract review | No output fields exist for either; final metadata is application-resolved |
| Citation from unreferenced evidence | Engine review | Not included in a statement's final citations |
| Duplicate/reordered citations | Output parser/catalog review and mutation evidence | Model cannot submit citations; catalog sorting is deterministic, but final sort comparator has five uncovered mutants |
| Sourced claim backed by non-claim unit | Unit test | Rejected |
| Synthesis with fewer than two distinct evidence IDs | Unit test | Rejected |
| Inference/recommendation with high confidence | Unit tests | Rejected |
| Uncertainty with medium/high confidence | Unit test | Rejected |
| Recommendation without permission or framing | Unit tests | Rejected structurally |
| Opposite meaning with valid IDs | Inline tsx probe | Accepted; documented structural-only limit |
| Conditional broadened, exception omitted, descriptive-to-normative, unrelated synthesis | Validator inspection | Not semantically detectable; accepted M6 limitation, M7 evaluation requirement |
| Injection in question/context/evidence/title/citation locator | Prompt and provider-input inspection; committed adversarial case | Supplied as untrusted JSON and discouraged by developer prompt, but not deterministically neutralized; committed adversarial case never reaches provider due impossible filter |
| Invent URL/claim, reveal secret, execute SQL/tool, generate ADR/approval | Contract and prompt inspection | URLs/source IDs are impossible in model schema; no tools or SQL are exposed; prose intent is only prompt-governed and not semantically detected |
| Exceed statement count | Parser/grounding tests | Rejected |
| 100,000-character statement text from provider | Inline tsx probe | Application parser accepted it; production API token bound limits normal OpenAI output; M6-AUD-006 |
| HTTP 400/401/403 | Inline mock-fetch probe | One call; terminal HTTP/auth error |
| HTTP 408/409/429/500 | Inline mock-fetch probe, two attempts | Retried once, then terminal HTTP error |
| Network failure | Inline mock-fetch probe | Two attempts, then unavailable |
| Timeout | Inline abort probe | Bounded, unavailable, not refusal |
| Malformed/incomplete/missing/model mismatch | Unit tests and parser review | Fail closed with contract/incomplete errors |

## Citation and epistemic assessment

Application-side catalog construction and final resolution are sound in
isolation: the model only emits evidence and claim IDs, and `resolvedCitations`
selects metadata from `context.citation_catalog`. The critical defect is that
grounding does not ask whether that catalog contains a citation. It counts the
raw citation objects attached to evidence, including objects that catalog
construction deliberately excludes for null title or URL. Thus the advertised
control “all assertive answers have application-resolved citations” is false at
the audited SHA.

Epistemic labels are closed and their structural rules are mostly enforced.
They remain model-selected labels, however. The validator cannot distinguish an
assertion worded as uncertainty, a recommendation worded as inference, or a
false statement carrying valid sourced IDs. This is a known structural-versus-
semantic boundary, not evidence that the categories are semantically correct.

## Provider-security assessment

The production adapter has several strong controls: environment-originated API
key, authorization-header-only use, no repository persistence/logging, `store:
false`, strict structured output, bounded attempts/timeout/backoff, terminal auth
and contract failures, explicit refusal handling, and returned-model checking.
The HTTP behavior matched the intended transient set in direct probes.

Two qualifications remain. First, data classification is not a property of a
request or context and the provider does not enforce its own
`allowedDataClassifications`; the CLI is the sole guard. Second, `gpt-5.6` is a
routing alias, not an immutable snapshot. Current official OpenAI documentation
lists model ID `gpt-5.6-sol` and alias `gpt-5.6`, and says Structured Outputs are
supported ([GPT-5.6 Sol model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-sol)).
The provider contract shape is current, but the repository's “exact model”
wording overstates pinning.

## Evaluation-quality assessment

The 15-case draft corpus contains eight exact-ID cases, four ordinary
natural-language questions, two no-answer cases forced empty by impossible
domain/concept filters, and one injection case forced empty by an impossible
status filter. Evaluation also forces every case to claim units. `holdout` is
parsed but never partitions execution or reporting, and the cases are committed
beside the implementation, so holdout credibility is nominal.

The metrics are deterministic and arithmetically straightforward, including a
safe zero-length mean. They are too weak for the claims at issue:

- expected-claim recall measures only presence of expected IDs and ignores
  precision, ranking, and statement meaning;
- citation completeness and resolvability are vacuously true for no-answer
  cases and inspect the already-resolved packet, so the nullable-citation bypass
  can still produce an answer before the evaluation flags it;
- epistemic completeness checks only that a label is truthy, which the parser
  already guarantees;
- unsupported count means only assertive statements with zero evidence IDs;
- prohibited output means only any statement in a designated no-answer case;
  it does not detect SQL/tool/secret/ADR/approval/injection prose;
- no metric measures entailment, condition preservation, exception retention,
  calibration, latency, or cost.

The report's evidence-class disclaimer is correct: this benchmark proves
functional deterministic plumbing only. No authorized real-provider run was
available, so real-provider semantic quality, calibration, prompt-injection
behavior, latency, and cost remain unmeasured.

## Coverage and mutation assessment

The independently reproduced coverage totals match the implementation report.
Relevant file coverage was: context 95.45% statements/91.66% branches; engine
97.43%/91.80%; evaluation 89.02%/83.33%; output contract 82.85%/78.46%; provider
87.83%/82.92%; request 85.50%/84.28%.

The focused mutation gate also reproduced exactly:

| File | Total mutation score | Survived | No coverage |
| --- | ---: | ---: | ---: |
| All six mutated files | 71.47% | 183 | 15 |
| `rag-context.ts` | 84.62% | 4 | 0 |
| `rag-engine.ts` | 80.65% | 19 | 5 |
| `rag-evaluation.ts` | 65.49% | 49 | 0 |
| `rag-output-contract.ts` | 72.32% | 29 | 2 |
| `rag-provider.ts` | 61.35% | 55 | 8 |
| `rag-request.ts` | 78.74% | 27 | 0 |

The configured gate passed, but provider sensitivity is only just above the
threshold. Surviving mutants include removal or weakening of the citation-title
and URL guard, retry status branches, evaluation corpus validation, request
bounds/defaults, recommendation framing branches, and exact boundary
comparisons. Five final-citation sorting mutants and eight provider mutants had
no coverage. The mutation scope excludes the CLI, CLI arguments, configuration,
and types, and excludes array, arrow-function, method, object-literal, regex,
and string-literal mutations. Consequently this gate is useful regression
evidence, not broad assurance for all high-risk M6 policy code.

## Findings

### M6-AUD-001 — Raw-citation/catalog mismatch permits uncited assertive answers

- **Severity:** High
- **Affected files and lines:** `src/retrieval-types.ts:10-15`;
  `src/rag-context.ts:72-84`; `src/rag-engine.ts:97-102,201-213`;
  `tests/rag-context-engine.test.ts:191-199`.
- **Evidence and reproduction:** Build a normal retrieval packet, replace its
  citation with `{ source_id: "AKS-000001", title: null, url: null, locators: []
  }`, build context, and answer with `DeterministicFakeRagProvider`. The catalog
  had zero entries because context construction skips the citation. Grounding
  returned no diagnostics because it counted the raw citation object. The final
  packet was `answered`; its statement had zero resolved citations and rendered
  without a source link. The existing missing-citation test uses an empty raw
  array and does not cover this valid M5 shape. Mutation testing independently
  left both nullable-citation guard mutants alive.
- **Expected behavior:** Every assertive statement must have at least one
  application-resolved catalog citation with governed source metadata, or fail
  closed.
- **Observed behavior:** A raw but unresolvable citation satisfies grounding and
  disappears during final resolution.
- **Architecture/security impact:** The output can present governed-looking,
  assertive architecture advice without the citation needed for traceability.
  This violates repository evidence authority and the ADR's central citation
  invariant.
- **Blocks M7:** Yes.
- **Recommended remediation boundary:** Make grounding validate against the
  exact application citation catalog/resolution result, define nullable-source
  behavior explicitly, and add negative and mutation tests for null title, null
  URL, both null, and mixed resolvable/unresolvable citations. This audit does
  not implement the change.

### M6-AUD-002 — Context fingerprint omits material evidence and trusts stale hashes

- **Severity:** Medium
- **Affected files and lines:** `src/rag-context.ts:24-57`;
  `src/rag-types.ts:38-54`; `tests/rag-context-engine.test.ts:23-45`.
- **Evidence and reproduction:** Build a context, then build another packet with
  the same `content_hash`, citations, and graph provenance but change
  `retrieval_text` to injected text and change the title. Both contexts produced
  the identical fingerprint
  `sha256:390ab3e1394c5cc93fbc2eefcfea32b39deecd16abccd37a7ca9b3282d35c6b0`.
  The fingerprint includes the declared content hash but neither verifies it nor
  directly binds title, text, record/concept IDs, unit kind, path, lifecycle,
  scope, or confidence. The existing tamper test changes the hash, citation,
  graph path, or project context, not the copied content itself.
- **Expected behavior:** Tampering with any material field that reaches the
  prompt must change the fingerprint or be rejected through verified content
  hashes/contracts.
- **Observed behavior:** Material prompt content can change while provenance
  remains byte-for-byte identical.
- **Architecture/security impact:** The fingerprint cannot prove which evidence
  the model received and is unsafe as an audit or cache identity across the
  M5-to-M6 trust boundary.
- **Blocks M7:** Yes.
- **Recommended remediation boundary:** Verify retrieval-unit hashes against a
  canonical material projection and/or fingerprint every prompt-visible
  evidence field plus all material retrieval/degradation provenance. Add
  one-field-at-a-time tamper tests. Treat the change as a versioned contract
  migration.

### M6-AUD-003 — External data classification is enforced only by the CLI

- **Severity:** Medium
- **Affected files and lines:** `src/rag-cli.ts:40-50,102-120`;
  `src/rag-provider.ts:24-46`; `src/rag-types.ts:21-35,65-75,125-130`.
- **Evidence and reproduction:** Static call-path review shows the CLI calls
  `assertClassificationAllowed` before constructing `RagEngine`, but
  `RagRequest` and `RagContextPacket` contain no data classification and neither
  `RagEngine.answer` nor `OpenAIRagProvider.generate` invokes a classification
  guard. The provider's allow-list is passive metadata. A direct engine/provider
  caller therefore has no classification value to check before `fetch`.
- **Expected behavior:** The component that performs the external invocation
  must fail closed on disallowed or missing classification, regardless of the
  caller or composition root.
- **Observed behavior:** The documented control holds for the current CLI path
  only and can be bypassed through the exported reusable API likely to be
  consumed by M7.
- **Architecture/security impact:** A future in-process consumer can send
  restricted governed evidence to an external provider without the intended
  policy check.
- **Blocks M7:** Yes.
- **Recommended remediation boundary:** Carry a validated classification in the
  request/context contract and enforce it at the last responsible external-call
  boundary, with tests proving `fetch` is not called for denied, unknown, or
  missing classifications. This is a contract change and was not made here.

### M6-AUD-004 — Functional evaluation does not exercise adversarial or realistic no-answer behavior

- **Severity:** Medium
- **Affected files and lines:** `evaluation/rag-golden.yaml:7-21`;
  `src/rag-evaluation.ts:53-68,70-105,120-146,150-167`;
  `tests/rag-evaluation.test.ts:7-105`.
- **Evidence and reproduction:** Eight of 15 cases are exact claim IDs. Both
  no-answer questions are forced empty by `not-in-corpus` filters. The sole SQL
  prompt-injection case is also forced empty, so the provider never sees it.
  `holdout` is parsed but unused in scoring/partitioning. Metrics inspect IDs and
  output shape but not semantic meaning or prohibited prose.
- **Expected behavior:** An MVP functional-clearance corpus should include
  representative natural-language retrieval, natural empty/insufficient cases,
  conflict and ambiguity, and adversarial inputs that actually cross the model
  boundary, with metrics that cannot be satisfied by exact-ID copying alone.
- **Observed behavior:** The deterministic fake can obtain perfect scores while
  never confronting injection and while all no-answer cases are predetermined
  by impossible filters.
- **Architecture/security impact:** The green RAG evaluation materially
  overstates the exercised safety surface and does not support M7 entry for
  architecture advice.
- **Blocks M7:** Yes.
- **Recommended remediation boundary:** Expand and independently partition the
  corpus; remove impossible-filter shortcuts from the primary no-answer and
  injection cases; add negative precision, prohibited-intent, epistemic,
  conditional/exception, and semantic review measures; retain the fake result
  as functional evidence and separately authorize real-provider sampling.

### M6-AUD-005 — `gpt-5.6` is an alias, not an immutable exact model pin

- **Severity:** Low
- **Affected files and lines:** `src/rag-config.ts:12-16`;
  `docs/adr/0007-governed-architecture-rag.md:62-72`;
  `docs/m6-implementation-report.md:44-48`.
- **Evidence and reproduction:** Current official OpenAI model documentation
  identifies `gpt-5.6` as an alias routing to model ID `gpt-5.6-sol`. The code
  and tests consistently enforce the alias string, but the documents call it an
  “exact model.”
- **Expected behavior:** Reproducibility language should distinguish an alias
  from an immutable snapshot/version and document provider behavior when the
  response reports a resolved model name.
- **Observed behavior:** Provider/model equality is exact for the configured
  alias, but underlying behavior is not proven immutable.
- **Architecture/security impact:** Longitudinal evaluation and incident
  reproduction may drift even though repository configuration is unchanged.
- **Blocks M7:** No, provided the evidence limitation is corrected and a stable
  model-version policy is established before production-quality claims.
- **Recommended remediation boundary:** Use an available immutable snapshot or
  describe the alias accurately and version evaluation evidence by observed
  provider model. Verify returned-model semantics against an authorized live
  response before enabling production.

### M6-AUD-006 — Application output bounds and focused mutation assurance are incomplete

- **Severity:** Low
- **Affected files and lines:** `src/rag-output-contract.ts:20-58,61-84,132-145`;
  `src/rag-provider.ts:46-66`; `stryker.rag.config.json:5-28`.
- **Evidence and reproduction:** The application parser accepted a
  100,000-character statement because strings and per-statement arrays have no
  application maximum; the normal OpenAI path is limited by
  `max_output_tokens`, so this is defense-in-depth rather than a demonstrated
  live-provider bypass. Mutation reproduced 183 survivors and 15 uncovered
  mutants; the provider scored 61.35%, and high-risk CLI/configuration logic is
  outside mutation scope.
- **Expected behavior:** Application validation should independently bound all
  untrusted response dimensions that can affect memory, logs, or downstream UI,
  and focused mutation should sensitively cover high-risk policy branches.
- **Observed behavior:** Provider-side token limits are the primary prose/list
  size bound, while exported/injected providers can return much larger accepted
  objects; the mutation gate offers limited sensitivity in several policy areas.
- **Architecture/security impact:** A faulty/custom provider can impose
  avoidable resource or downstream-rendering load, and the passing mutation
  score can mask boundary-test gaps.
- **Blocks M7:** No by itself; it should be bounded before exposing the engine to
  additional providers or a UI.
- **Recommended remediation boundary:** Add schema and application length/count
  bounds aligned with the request contract, exact-maximum tests, and a
  risk-weighted mutation scope/threshold. Do not treat provider validation as a
  replacement for application validation.

### M6-AUD-007 — Structural grounding is intentionally not semantic entailment

- **Severity:** Observation
- **Affected files and lines:** `src/rag-engine.ts:75-157`;
  `docs/adr/0007-governed-architecture-rag.md:55-58`;
  `docs/m6-architecture-rag.md:122-126`;
  `docs/m6-implementation-report.md:100-103`.
- **Evidence and reproduction:** Opposite-meaning and normative prose carrying
  valid IDs passed; an uncertainty-only `answered` packet also passed. The
  limitation is explicitly documented.
- **Expected behavior:** M6 claims must remain limited to structural grounding;
  M7 advice needs semantic and human evaluation.
- **Observed behavior:** Documentation is accurate, but prompt instructions are
  the only semantic/prompt-injection defense.
- **Architecture/security impact:** Users can over-trust fluent but unsupported
  prose if a consuming UI hides the epistemic and evidence details.
- **Blocks M7:** Not as an M6 defect by itself; it is a required M7 design and
  evaluation constraint and reinforces M6-AUD-004.
- **Recommended remediation boundary:** Preserve visible epistemic/provenance
  presentation, add representative semantic/human evaluation, and never market
  structural validity as entailment.

### M6-AUD-008 — Four GitHub Actions Node.js 20 deprecation annotations

- **Severity:** Observation
- **Affected files and lines:** `.github/workflows/validate.yml:20-29,62-71,112-119`.
- **Evidence and reproduction:** Each exact-SHA job log ended with one warning
  that JavaScript actions still target Node.js 20 and were forced onto Node.js
  24. All four jobs succeeded.
- **Expected behavior:** Maintained action majors should target a supported
  runner runtime before forced compatibility is removed.
- **Observed behavior:** Four maintenance annotations, no demonstrated M6
  functional failure.
- **Architecture/security impact:** Future runner policy changes may break CI or
  leave old action runtimes in use.
- **Blocks M7:** No.
- **Recommended remediation boundary:** Upgrade and pin maintained action
  versions in a separate CI-maintenance change, then verify the same job matrix.

## Unverified controls and evidence gaps

- No live OpenAI request was authorized or made. Provider acceptance of this
  exact schema, returned-model naming for the alias, refusal/incomplete shapes,
  real prompt-injection behavior, semantic accuracy, calibration, latency, cost,
  and service-side retention are unverified.
- Local PostgreSQL was unavailable, so four local integration tests were
  skipped. This is mitigated, not erased, by inspected exact-SHA hosted logs
  showing the full pgvector integration suite passed.
- The implementation does not log request/response bodies, and sends `store:
  false`; this audit did not independently inspect external provider systems.
- GitHub evidence was accessible through immutable API/job-log records. No
  success was inferred solely from local reports or screenshots.

These gaps do not cause the final verdict: the decisive blockers are
reproducible local implementation and evaluation defects.

## Residual risks and accepted limitations

- Semantic entailment, prompt-injection resistance, conflict interpretation,
  and recommendation quality remain model/human evaluation concerns. This is an
  accepted M6 limitation only while accurately disclosed and not used as an M7
  quality claim.
- A deterministic fake provider proves plumbing and stable governance behavior,
  not production model behavior.
- The current CLI correctly guards M5 currentness and classification, but
  exported component reuse has a wider trust boundary than the CLI documents.
- No lifecycle state was elevated, and no content was described as reviewed,
  approved, published, or canonical by this audit.

## M7 entry-condition matrix

| Required condition | Result | Basis |
| --- | --- | --- |
| Audited SHA and hosted SHA match | Pass | Local, remote, and run 31705024553 all match |
| Linux and Windows validation pass | Pass | Exact-SHA jobs 94463298234 and 94463298264 |
| PostgreSQL/pgvector integration and RAG evaluation pass | Pass as configured | Exact-SHA job 94463298391; evaluation validity is separately failed below |
| Focused M6 mutation passes configured threshold | Pass | 71.47% against 60%, local and hosted |
| No Critical or High finding remains | **Fail** | M6-AUD-001 is High |
| No unresolved Medium permits unsupported/misclassified advice | **Fail** | M6-AUD-002 through M6-AUD-004 remain open |
| Citations are application-resolved and cannot be fabricated | **Fail** | Metadata is application-resolved, but nullable raw citations bypass required final resolution |
| Empty, stale, malformed, refused, unavailable states fail safely | Partial | Verified for production CLI paths; material packet tampering and reusable classification boundary fail |
| Epistemic labels and recommendation framing are enforceable | Partial | Structural shape is enforced; semantic category escape remains an accepted limitation |
| Structural grounding is not represented as entailment | Pass in documentation | ADR/guide/report state the limitation accurately |
| Evaluation corpus is sufficient for MVP functional clearance | **Fail** | M6-AUD-004 |
| Real-provider limitations remain explicit | Pass | Documents and report retain them |
| M7 cannot automate approval or lifecycle transitions | Pass | No such implementation or mutation path found |

## Final decision

The exact implementation SHA and CI execution are authentic, reproducible, and
substantially stronger than a summary-only green build. They do not overcome
the reproducible citation bypass, incomplete context identity, reusable
classification-policy gap, or evaluation weakness. M7 must not begin until the
blocking findings are remediated through separately authorized changes and
independently re-audited at a new exact SHA.

M6 NOT READY
