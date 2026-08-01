# M3 Final Security Remediation Report

## Baseline

This focused run remediated only M3-FINAL-001 through M3-FINAL-005 and
assessed M3-FINAL-006. It did not begin M4 or add retrieval, graph, search,
embedding, RAG, or application infrastructure.

| Item | Recorded baseline |
|---|---|
| Starting branch | `main` |
| Starting HEAD | `0fe30bec144741a9a3535ba7192a092fcd5a0ae8` |
| Starting divergence | `origin/main...HEAD = 0 0` |
| Starting worktree | Modified deterministic `generated/integrity/markdown-link-integrity.json` and untracked `docs/m3-final-focused-reaudit-report.md` from the immediately preceding audit; both were preserved as provenance. |
| Node.js | `v24.11.1` |
| pnpm | `10.23.0` |

No source was newly admitted or approved. No record crossed a human-only
lifecycle transition, and no content was marked reviewed, published, approved,
or canonical.

## Finding Disposition

| Finding | Disposition | Evidence |
|---|---|---|
| M3-FINAL-001 | Remediated. | AKL-000061 now owns issuer validation only. AKL-000064 through AKL-000069 separately preserve audience, conditional `azp`, non-direct signature validation, the direct Token Endpoint TLS alternative, expiration, and conditional nonce semantics. |
| M3-FINAL-002 | Remediated. | AKL-000062 is a medium-confidence, claim-context-only `recommendation` with no `normative` object. Its implication is `operational-recommendation`, and its notes distinguish source-supported token roles from repository-authored guidance. |
| M3-FINAL-003 | Remediated. | The claim schema, evidence validator, and generic security-claim validator enforce semantic applicability, exact force and qualification projection, direct admitted evidence and locators, and separation of protocol normativity from descriptive or repository-authored guidance. |
| M3-FINAL-004 | Remediated. | Isolated positive and negative regressions cover the complete required bypass matrix, production OIDC contracts, schema contracts, ledger allocations, and machine-authorized lifecycle events. The security suite contains 30 tests. |
| M3-FINAL-005 | Remediated. | AKL-000054 now applies to OAuth clients. AKL-000056 now applies to authorization servers and resource servers and retains the architecture/performance qualification. |
| M3-FINAL-006 | Accepted non-blocking observation. | Relationship validation was outside this focused remediation. The prior conclusion for AKR-000010 remains intact; incremental relationship strength-ceiling mutation tests remain follow-up hardening, not a current semantic blocker. |

## OIDC Validation Claim Matrix

Every row is directly bound in the AKC-000018 `claims` collection and projected
as a separate `normative-control` in its structured `security_implications`.
All rows have concept-global scope, high confidence, direct admitted source
AKS-000019, and an exact locator.

| Claim ID | Control | Force | Actor | Applicability / condition | Exception | Source locator | Structured bindings |
|---|---|---|---|---|---|---|---|
| AKL-000061 | Issuer validation | `must` | OpenID Connect clients validating an ID Token from a configured OpenID Provider | The configured issuer must exactly match `iss`; unconditional within that validation context | None | OIDC Core 3.1.3.7 item 2 | AKC-000018 claim declaration plus exact normative implication |
| AKL-000064 | Audience validation | `must` | OpenID Connect clients validating an ID Token audience | Client identifier must be an audience; tokens with no valid client audience or an untrusted additional audience are rejected | None | OIDC Core 3.1.3.7 item 3 | AKC-000018 claim declaration plus exact normative implication |
| AKL-000065 | Authorized party (`azp`) validation | `should` | OpenID Connect clients | Only when an extension makes `azp` applicable | None beyond the governed applicability condition | OIDC Core 3.1.3.7 items 4 and 5 | AKC-000018 claim declaration plus exact conditional normative implication |
| AKL-000066 | Signature validation | `must` | OpenID Connect clients outside direct Token Endpoint communication | ID Token was not received by direct communication from the Token Endpoint | Direct Token Endpoint handling is represented separately, not erased | OIDC Core 3.1.3.7 item 6 | AKC-000018 claim declaration plus exact conditional normative implication |
| AKL-000067 | Direct Token Endpoint TLS alternative | `may` | OpenID Connect clients receiving an ID Token directly from the Token Endpoint | ID Token was received by direct communication from the Token Endpoint | TLS server validation may validate the issuer in place of checking that token's signature | OIDC Core 3.1.3.7 item 6 | AKC-000018 claim declaration plus exact conditional normative implication |
| AKL-000068 | Expiration validation | `must` | OpenID Connect clients validating ID Token expiration | Current time must precede `exp` | None | OIDC Core 3.1.3.7 item 9 | AKC-000018 claim declaration plus exact normative implication |
| AKL-000069 | Nonce validation | `must` | OpenID Connect clients | Only when a nonce was sent in the Authentication Request | Nonce presence and equality are not asserted for a request that sent no nonce | OIDC Core 3.1.3.7 item 11 | AKC-000018 claim declaration plus exact conditional normative implication |

AKL-000061 retained its immutable identifier and records the semantic migration
from the former umbrella. New IDs AKL-000064 through AKL-000069 were allocated
through the ledger. Each new claim has only automated
`proposed -> source-candidate -> sourced` lifecycle evidence.

## AKL-000062 Disposition

| Property | Final representation |
|---|---|
| Source-supported fact | OAuth access tokens and OpenID Connect ID Tokens have distinct protocol roles and intended recipients, grounded in AKL-000059 and AKL-000060 and directly located in AKS-000017 and AKS-000019. |
| Repository-authored recommendation | A client should not substitute an ID Token when an API contract requires an audience-bound OAuth access token. The statement explicitly begins `Repository guidance recommends`. |
| Claim type | `recommendation` |
| Normative force | None; the `normative` object was removed. |
| Semantic scope | `claim-context-only` |
| Structured implication kind | `operational-recommendation` |
| Condition | The API expects an OAuth access token issued for its audience. |

This preserves useful architecture guidance without claiming that the cited
protocol sections contain an uppercase `MUST NOT` prohibition.

## Validator Bypass Matrix

| Bypass | Root cause | Schema correction | Validator correction | Isolated negative evidence | Result |
|---|---|---|---|---|---|
| A: normative content hidden under a non-normative kind | Structured implications were not lexically and semantically checked across all kinds. | Existing implication kinds remain available; claim schema v2 prohibits normative metadata on recommendations. | A lexical guard covers MUST, MUST NOT, SHOULD, SHOULD NOT, RECOMMENDED, and MAY; issued protocol force requires `normative-control` and non-empty claim bindings. | `security-risk`, `implementation-observation`, and `operational-recommendation` protocol-force tests; empty normative binding test. | Deterministic `SECURITY_NORMATIVE_KIND` or `SECURITY_NORMATIVE_CLAIM_REQUIRED`. |
| B: statement, force, condition, or exception mismatch | Only implication text equality and normative-object presence were checked. | Normative claims retain governed force, conditions, exceptions, source arrays, and locators as structured fields. | The validator compares declared force with statement force, exact claim/implication text, conditional qualification, exception qualification, and claim type. | Weaker and stronger force, removed exception, removed condition, wrong non-empty condition, wrong non-empty exception, broadened implication, and recommendation-as-MUST-NOT tests. | Deterministic force, condition, exception, scope, or claim-type diagnostics. |
| C: sourced normative guidance without direct evidence | Derived evidence could exist while direct source arrays were empty, and loops did not require a direct source. | Claim schema v2 requires non-empty `sources` and `source_locations` whenever `normative` is present. | Both evidence and security validators require direct admitted, located, in-domain sources; derivation cannot substitute for them. | No direct source, derived-only, no locator, wrong-source locator, non-admitted source, and out-of-domain source tests. | Deterministic `CLAIM_NORMATIVE_*` and `SECURITY_*` evidence diagnostics. |
| D: irrelevant cross-boundary claim reuse | Shared source adjacency was treated as sufficient relevance. | Claim schema v2 adds governed `applicable_concept_ids`. | A bound claim must be owned by the target concept or explicitly name it as applicable; every applicable sourced normative claim must also remain projected. | OIDC-to-OAuth and OAuth-to-OIDC negatives, implication-and-declaration removal negative, and explicit-applicability positive. | Deterministic `SECURITY_CLAIM_APPLICABILITY` or `SECURITY_APPLICABLE_CLAIM_MISSING`. |

The production OAuth claims reused by OIDC declare AKC-000018 explicitly in
`applicable_concept_ids`; relationship or source adjacency alone grants no
reuse authority.

## Files Changed

### Claims and knowledge units

- Updated AKL-000050, AKL-000051, AKL-000052, AKL-000054, AKL-000056,
  AKL-000059, AKL-000061, and AKL-000062.
- Added AKL-000064 through AKL-000069.
- Updated the OAuth 2.0 Authorization Framework and OpenID Connect knowledge
  units.

### Schema, governance, and decision records

- Updated `schemas/claim.schema.json` and advanced its registry contract in
  `schemas/registry.json` from version 1 to version 2.
- Updated `ids/ledger.yaml` and `governance/lifecycle-events.yaml` for the six
  new claim IDs and automation-only lifecycle transitions.
- Added `docs/adr/0004-security-claim-applicability-and-projection.md`.
- Preserved `docs/m3-final-focused-reaudit-report.md` as the audit provenance
  that triggered this remediation.

### Validators and tests

- Updated `src/security-claim-validator.ts` and
  `src/evidence-validator.ts`.
- Updated `tests/security-claim.test.ts`, `tests/evidence.test.ts`,
  `tests/schema.test.ts`, and `tests/m3-semantic-remediation.test.ts`.
- `src/markdown-validator.ts` was mutation-tested as required but did not need a
  source change.

### Deterministic artifacts

The report generator updated:

- `generated/integrity/lifecycle-distribution.json`
- `generated/integrity/markdown-link-integrity.json`
- `generated/integrity/schema-coverage.json`
- `generated/integrity/source-usage.json`
- `generated/integrity/summary.json`
- `generated/integrity/unresolved-references.json`

No generated artifact was hand-edited.

## Validation Results

All commands used Node.js 24.11.1 and pnpm 10.23.0. No coverage or mutation
threshold was lowered, and no global timeout was increased.

| Command | Actual result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass; lockfile current. The existing ignored-esbuild-build-script warning remained informational. |
| `pnpm format:check` | Pass. |
| `pnpm validate` | Pass; schema, vocabulary, IDs, sources, claims, relationships, lifecycle, Markdown, and links returned 0 errors and 0 warnings. |
| `pnpm test` | First parallel run had three existing 5-second test timeouts under transient local contention and no assertion failure; unchanged rerun passed 18 files and 121/121 tests in 20.59 seconds. No timeout was widened. |
| `pnpm test:coverage` run 1 | Pass; 121/121 tests in 37.48 seconds; 94.51% statements, 81.61% branches, 98.13% functions, 95.37% lines. |
| `pnpm test:coverage` run 2 | Pass; 121/121 tests in 37.71 seconds with identical coverage. |
| `pnpm report:integrity` run 1 | Pass; 12 deterministic reports written. |
| `pnpm report:integrity` run 2 | Pass; 12 deterministic reports written. |
| `pnpm report:check` | Pass; 12/12 reports current. |
| `git diff --check` | Pass. |

Targeted mutation results before the final focused strengthening were:

| Validator | Total score | Covered score | Killed | Timed out | Survived | No coverage |
|---|---:|---:|---:|---:|---:|---:|
| Evidence | 89.41% | 89.94% | 132 | 20 | 17 | 1 |
| Markdown | 60.00% | 69.94% | 112 | 2 | 49 | 27 |
| Security claim | 85.04% | 88.05% | 183 | 16 | 27 | 8 |
| Combined | 78.28% | 83.33% | 427 | 38 | 93 | 36 |

After adding isolated tests for non-empty but incorrect condition and exception
metadata, wrong-source locators, empty normative bindings, and invalid
recommendation backing, the final security-only mutation rerun passed:

| Validator | Total score | Covered score | Killed | Timed out | Survived | No coverage |
|---|---:|---:|---:|---:|---:|---:|
| Security claim | 94.44% | 96.93% | 197 | 24 | 7 | 6 |

The unchanged mutation break threshold is 60%. Equivalent repository fixtures
prove that the four original bypass classes now produce deterministic
diagnostics; mutation score is supporting evidence rather than the sole proof.

## Hosted Clean-Checkout Evidence

| Item | Result |
|---|---|
| Implementation commit | `4844c2afb8c49915be8c1710fc1bff836abcad46` |
| GitHub Actions run | `30714859324` |
| Triggering commit | `4844c2afb8c49915be8c1710fc1bff836abcad46` |
| Ubuntu validation | Success; job `91408629637` |
| Windows validation | Success; job `91408629614` |
| Mutation | Success; job `91408629627` |
| Overall | Success on the implementation commit. |

The final report commit and its triggering workflow necessarily occur after
this document's content is created. Their SHA, run ID, per-job conclusions,
clean worktree, and final divergence are therefore recorded in the release
handoff after the final report commit, rather than fabricated inside the
self-referential commit.

## Residual Risks

### Blockers

None identified within M3-FINAL-001 through M3-FINAL-005 after local and hosted
validation.

### Non-blockers

- M3-FINAL-006 remains an incremental relationship-validator mutation-test
  strength opportunity; no current relationship semantic widening was found.
- Source locators remain governed strings rather than typed section objects.
- Seven security-validator mutants survived the focused rerun. They are mainly
  diagnostic-expression or boundary-equivalent changes plus an
  operational-recommendation exact-projection test-strength gap; the production
  rule remains implemented and the four reproduced bypass classes are closed.
- The first unconstrained parallel test run experienced transient local
  resource contention. The unchanged rerun and both two-worker coverage runs
  passed, and hosted Ubuntu and Windows validation passed.
- Full hosted mutation duration increased with the expanded validator and test
  surface; it completed successfully without threshold or timeout changes.

## Exit Verdict

READY FOR FINAL M3 REGRESSION RE-AUDIT
