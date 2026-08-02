# Final M3 Regression Re-Audit: M3-REG-001 Exit Decision

Audit date: 2026-08-02, Asia/Jakarta

## Executive Summary

All ten bounded exit conditions pass. The original M3-REG-001 classification
bypass is no longer reproducible, neutral wording cannot camouflage a bound
normative claim, prior security controls remain active, AKL-000056 retains its
semantics with the corrected locator, deterministic local gates pass, and
hosted Linux, Windows, and mutation jobs pass on the exact audited repository
tip.

This audit did not change production code, claims, tests, ontology, or lifecycle
state and did not begin M4 implementation.

## Scope Statement

This was a bounded independent regression audit of:

- metadata-driven security-implication classification;
- preservation of lexical defense-in-depth;
- preservation of legitimate descriptive implications;
- AKL-000056 locator precision and semantic stability;
- deterministic local validation; and
- Git and hosted-CI provenance.

It was not a broad M3 corpus re-audit, semantic exploration, architecture
redesign, or M4 implementation run. The remediation report was treated as an
assertion and checked against implementation, production data, tests,
independent in-memory probes, Git history, and hosted CI.

## M3-REG-001 Reproduction Matrix

The negative probes retained the production AKL-000061 claim binding and
mutated its OIDC projection in memory. For every metadata-driven rejection, the
diagnostic message was also checked to contain the invalid implication kind,
`AKL-000061`, and the required `normative-control` kind.

| Probe | Expected | Actual | Verdict |
|---|---|---|---|
| `security-risk` + lowercase + normative claim | Reject | `SECURITY_NORMATIVE_KIND`; complete diagnostic context present | Pass |
| `security-risk` + neutral + normative claim | Reject | `SECURITY_NORMATIVE_KIND`; complete diagnostic context present | Pass |
| `implementation-observation` + lowercase + normative claim | Reject | `SECURITY_NORMATIVE_KIND`; complete diagnostic context present | Pass |
| `implementation-observation` + neutral + normative claim | Reject | `SECURITY_NORMATIVE_KIND`; complete diagnostic context present | Pass |
| `operational-recommendation` + normative claim | Reject | `SECURITY_NORMATIVE_KIND` plus `SECURITY_RECOMMENDATION_MODEL` | Pass |
| Valid `normative-control` | Accept | Zero diagnostics on the production projection | Pass |
| Descriptive non-normative implication | Accept | Bound non-normative risk and unbound descriptive observation both produced zero diagnostics | Pass |

An additional unbound `security-risk` containing uppercase `MUST` was rejected
with `SECURITY_NORMATIVE_KIND`. This confirms the lexical detector remains
active as defense-in-depth while structured claim metadata is the primary
authority for bound claims.

## Test-Quality Verification

The committed synthetic regression suite retains the normative claim binding
in the lowercase and neutral negative fixtures; it does not merely make a regex
case-insensitive or remove the claim.

| Required scenario | Explicit coverage | Result |
|---|---|---|
| `security-risk` + lowercase prose + normative claim | Yes | Pass |
| `security-risk` + neutral prose + normative claim | Yes | Pass |
| `implementation-observation` + lowercase prose + normative claim | Yes | Pass |
| `implementation-observation` + neutral prose + normative claim | Yes | Pass |
| `operational-recommendation` + normative claim | Yes | Pass |
| Descriptive unbound `security-risk` | Yes | Pass |
| Descriptive unbound `implementation-observation` | Yes | Pass |
| Descriptive implication + non-normative descriptive claim | Yes | Pass |
| Valid `normative-control` projection | Yes | Pass |
| Uppercase normative prose without claim | Yes | Pass |
| Production repository has zero security diagnostics | Yes | Pass |

## Existing-Control Regression Matrix

These results came from independent in-memory mutations of the production
model, not only from inspection of test names.

| Existing enforcement | Expected diagnostic | Actual result |
|---|---|---|
| Unresolved claim rejection | `SECURITY_CLAIM_UNRESOLVED` | Active |
| Undeclared claim rejection | `SECURITY_CLAIM_UNDECLARED` | Active |
| Claim applicability | `SECURITY_CLAIM_APPLICABILITY` | Active |
| Lifecycle eligibility | `SECURITY_CLAIM_STATUS` | Active |
| Direct source presence | `SECURITY_NORMATIVE_DIRECT_SOURCE` | Active |
| Admitted source requirement | `SECURITY_CLAIM_EVIDENCE` | Active |
| Exact source locator | `SECURITY_SOURCE_LOCATION` | Active |
| Source-domain admission | `SECURITY_SOURCE_SCOPE` | Active |
| Eligible normative claim type | `SECURITY_NORMATIVE_CLAIM_TYPE` | Active |
| Exact statement projection | `SECURITY_NORMATIVE_SCOPE` | Active |
| Force consistency | `SECURITY_NORMATIVE_FORCE` | Active |
| Structured condition preservation | `SECURITY_NORMATIVE_CONDITION` | Active |
| Structured exception preservation | `SECURITY_NORMATIVE_EXCEPTION` | Active |
| Complete applicable normative projection | `SECURITY_APPLICABLE_CLAIM_MISSING` | Active |
| Recommendation versus protocol force | `SECURITY_NORMATIVE_KIND` and recommendation-model separation | Active |

All 24 independent probe rows passed: nine classification and acceptance rows,
eight resolution/applicability/lifecycle/evidence rows, and seven
projection/force/qualification/completeness rows.

## AKL-000056 Verification

The exact locator is:

```text
RFC 9700 Sections 2.2.1 and 4.10
```

Git comparison of the implementation commit against its parent shows the
locator as the only AKL-000056 change. The following remain unchanged:

- ID `AKL-000056`;
- subject `AKC-000017`;
- predicate `recommends-access-token-sender-constraint`;
- authorization-server and resource-server actors;
- `SHOULD` force;
- architecture/performance exception;
- source `AKS-000018`;
- `sourced` lifecycle status;
- concept-global scope and applicability meaning; and
- version 2 semantics.

The preserved statement remains:

```text
Authorization servers and resource servers SHOULD use sender-constraining
mechanisms for access tokens, such as mutual TLS or DPoP, unless architecture
or performance constraints prevent their use.
```

## Command Evidence

Commands were run on audited baseline commit
`03cf72407c4c3f50a267b12689a5418d17eeec48`.

| Command or check | Actual result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass; lockfile current, pnpm 10.23.0; unchanged ignored-esbuild-build-script notice |
| `pnpm format:check` | Pass |
| `pnpm validate` | Pass; 0 errors and 0 warnings across typecheck, schema, vocabulary, IDs, sources, claims, relationships, lifecycle, Markdown, and links |
| `pnpm report:check` | Pass; 12/12 current |
| `pnpm test`, run one | Pass; 18 files, 127/127 tests, 20.34 seconds |
| `pnpm test`, run two | Pass; 18 files, 127/127 tests, 19.05 seconds |
| `pnpm test:coverage` | Pass; 18 files and 127/127 tests |
| Coverage | 94.52% statements, 81.73% branches, 98.13% functions, 95.38% lines |
| Focused security mutation | Pass; 92.53% total, 94.89% covered, 206 killed, 17 timed out, 12 survived, 6 no coverage, 0 errors |
| Production security validation | Zero diagnostics |
| Independent in-memory probes | 24/24 pass |

Coverage is exactly equal to the remediation handoff. The focused mutation
score is also exactly 92.53%. The killed/timeout distribution changed from
198/25 to 206/17 while the detected total, survivor count, no-coverage count,
and mutation score remained stable.

## Hosted and Git Provenance

The prompt's originally reported remediation state was independently verified:

| Property | Verified result |
|---|---|
| Remediation report commit | `be21bac73a5b0cfd89d436890c9eafd90cc63b91` |
| Hosted run | `30721674417` |
| Hosted head SHA | `be21bac73a5b0cfd89d436890c9eafd90cc63b91` |
| Ubuntu | Success; job `91426375103` |
| Windows | Success; job `91426375101` |
| Mutation | Success; job `91426375081` |
| Workflow conclusion | Success |

Before this audit, a later documentation-index commit became the repository
tip. Its diff from the remediation report commit contains only `README.md`,
`docs/README.md`, and regenerated Markdown-link integrity output. It does not
change the validator, claims, tests, or knowledge projection. The prompt permits
a different exact final commit when its hosted run is explicitly verified.

| Property | Verified result |
|---|---|
| Audited final HEAD | `03cf72407c4c3f50a267b12689a5418d17eeec48` |
| `origin/main` | `03cf72407c4c3f50a267b12689a5418d17eeec48` |
| Divergence | `0 0` |
| Worktree before allowed audit report | Clean |
| Exact-tip hosted run | `30742493211` |
| Hosted head SHA | `03cf72407c4c3f50a267b12689a5418d17eeec48` |
| Ubuntu | Success; job `91482275880` |
| Windows | Success; job `91482275904` |
| Mutation | Success; job `91482275878` |
| Workflow conclusion | Success |

The audit-report commit necessarily follows the audited repository tip. Its
commit SHA, final synchronization, and worktree state are recorded in the
post-commit handoff. No hosted-CI claim is made for that later self-referential
report commit unless a workflow actually completes on its exact SHA.

## Findings

No Critical or High issue remains within the bounded audit scope.

Non-blocking observations:

- Low: Twelve focused security-validator mutants survive and six have no
  coverage. The required semantic bypass is directly probed and closed; the
  remaining mutation opportunities do not reproduce it.
- Low: The local focused mutation run moved eight mutants from timeout to killed
  relative to remediation evidence. The final score remained exactly 92.53%, so
  this is runtime variation rather than a regression.
- Low: Source locators remain governed strings. AKL-000056 is exact and verified;
  typed locator structure remains a future governance improvement rather than a
  bounded exit blocker.

## Final Verdict

M4 READY
