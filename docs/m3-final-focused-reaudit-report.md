# Final Focused M3 Independent Re-Audit

Audit date: 2026-07-31, Asia/Jakarta

This is a review-only audit artifact. It does not mark any source, claim,
relationship, knowledge unit, recommendation, or architecture decision as
human-reviewed, approved, published, or canonical. No M4 work was started.

## Executive Verdict

HOLD M4

M3-REAUD-002, M3-REAUD-003, and M3-REAUD-004 are closed. M3-REAUD-001 remains
open because two OIDC controls exceed their cited normative evidence and the
security validator accepts several retrieval-unsafe structured mutations. The
green structural and CI gates do not override those semantic defects.

## Audit Scope and Method

The audit independently inspected the required reports and ADR, both security
knowledge units, AKL-000017, AKL-000018, AKL-000030, AKL-000033,
AKL-000034, AKL-000049 through AKL-000063, AKR-000010, admitted source
records, lifecycle events, the ID ledger, relevant schemas and policy, all four
target validators, fixtures, and relevant tests.

The hardening report was treated as an assertion, not proof. Source fidelity
was checked against the registered primary specifications:

- [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749.html);
- [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html);
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html).

Four read-only mutation-in-memory probes were also run against the production
security validator. They changed no repository file.

## Git and CI Provenance

The pre-audit committed baseline was:

| Property | Verified value |
|---|---|
| Branch | `main` |
| Final HEAD | `0fe30bec144741a9a3535ba7192a092fcd5a0ae8` |
| Worktree | Clean before this allowed audit report was created |
| `origin/main...HEAD` | `0 0` |
| Implementation commit | `504120820437f368fd1988bb1621138c26c0d2cf` |
| Final hardening-report commit | `0fe30bec144741a9a3535ba7192a092fcd5a0ae8` |

The difference from implementation commit to final hardening-report commit is
documentation-only: `docs/m3-focused-hardening-report.md` was added and
`generated/integrity/markdown-link-integrity.json` changed its Markdown file
count from 59 to 60. No production semantic record changed in that commit.

Both reported hosted runs exist and were verified through the GitHub Actions
API:

| Run | Triggering commit | Event | Branch | Workflow | Ubuntu | Windows | Mutation | Overall |
|---|---|---|---|---|---|---|---|---|
| [30569237983](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/30569237983) | `504120820437f368fd1988bb1621138c26c0d2cf` | `push` | `main` | `.github/workflows/validate.yml` | success | success | success | success |
| [30571643281](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/30571643281) | `0fe30bec144741a9a3535ba7192a092fcd5a0ae8` | `push` | `main` | `.github/workflows/validate.yml` | success | success | success | success |

Run 30571643281 is the final clean-checkout provenance evidence because it
tested the final committed M3 state, including the hardening report and its
generated link inventory.

## Finding Disposition

| Finding | Disposition | Severity | M4 blocking |
|---|---|---|---|
| M3-REAUD-001 | Open. Most OAuth/OIDC controls are directly grounded, but AKL-000061 and AKL-000062 exceed cited force or qualification, and the security validator has reproducible retrieval-safety bypasses. | High | yes |
| M3-REAUD-002 | Closed. AKL-000030 and AKR-000010 preserve the local dual-write boundary; the relationship is context-only and non-traversable. | None | no |
| M3-REAUD-003 | Closed. Both implementation and final documentation commits are pushed, synchronized, and proven by hosted Linux, Windows, and mutation jobs. | None | no |
| M3-REAUD-004 | Closed as a non-blocker. Two coverage runs passed without timeout; the worker cap is coverage-only and ordinary tests remain parallel. | Observation | no |

## OAuth/OIDC Claim Matrix

| Claim ID | Control | Claim type | Normative force | Semantic scope | Confidence | Source ID | Source section | Qualifier or exception | Structured bindings | Audit result |
|---|---|---|---|---|---|---|---|---|---|---|
| AKL-000049 | Public/confidential client capability | normalized-source-claim | none | concept-global | high | AKS-000017 | RFC 6749 2.1 | Client type depends on credential confidentiality and deployment capability. | OAuth observation | Pass |
| AKL-000050 | Public-client PKCE | normalized-source-claim | MUST | concept-global | high | AKS-000018 | RFC 9700 2.1.1 | Public authorization-code clients; no optional downgrade. | OAuth and OIDC normative controls | Pass |
| AKL-000051 | Confidential-client token-endpoint authentication | synthesis | MUST | concept-global | high | AKS-000017 | RFC 6749 2.3 and 3.2.1 | Uses the established method; selected profiles may be stricter. | OAuth and OIDC normative controls | Pass |
| AKL-000052 | Exact redirect matching | normalized-source-claim | MUST | concept-global | high | AKS-000018 | RFC 9700 2.1 and 4.1.3 | Native-app localhost loopback URIs may vary only by port. | OAuth and OIDC normative controls | Pass |
| AKL-000053 | Resource-owner password grant | normalized-source-claim | MUST NOT | concept-global | high | AKS-000018 | RFC 9700 2.4 | No exception. | OAuth normative control | Pass |
| AKL-000054 | Front-channel access-token responses | normalized-source-claim | SHOULD NOT | concept-global | high | AKS-000018 | RFC 9700 2.1.2 | Injection prevention and relevant leakage mitigations are preserved. | OAuth and OIDC normative controls | Qualified: source actor is clients; record says deployments. |
| AKL-000055 | Public-client refresh-token replay defense | normalized-source-claim | MUST | concept-global | high | AKS-000018 | RFC 9700 2.2.2 and 4.14.2 | Sender constraint or rotation; detect replay and revoke active token. | OAuth normative control | Pass |
| AKL-000056 | Access-token sender constraint | normalized-source-claim | SHOULD | concept-global | high | AKS-000018 | RFC 9700 2.2.1 and 4.10.1 | mTLS/DPoP are examples; architecture/performance constraints are preserved. | OAuth normative control | Qualified: the source actors are authorization and resource servers; record says deployments. |
| AKL-000057 | Least privilege and audience restriction | normalized-source-claim | SHOULD | concept-global | high | AKS-000018 | RFC 9700 2.3 | Minimum required privilege and audience. | OAuth normative control | Pass |
| AKL-000058 | Intended-recipient validation | normalized-source-claim | MUST | concept-global | high | AKS-000018 | RFC 9700 2.3 | Resource server refuses mismatched requests. | OAuth normative control | Pass |
| AKL-000059 | OAuth access-token role and format | synthesis | none | concept-global | high | AKS-000017 | RFC 6749 1.4 | Authorization credential; OAuth does not require universal JWT format. | OAuth and OIDC observations | Pass |
| AKL-000060 | OIDC ID Token role | normalized-source-claim | none | concept-global | high | AKS-000019 | OIDC Core 2 | JWT authentication assertion for its relying party. | OIDC observation | Pass |
| AKL-000061 | ID Token validation | normalized-source-claim | MUST | concept-global | high | AKS-000019 | OIDC Core 2 and 3.1.3.7 | azp and nonce applicability recorded; signature exception omitted. | OIDC normative control | Fail: High source-force and qualification mismatch. |
| AKL-000062 | ID Token API-credential boundary | recommendation | MUST NOT | claim-context-only | medium | AKS-000017 and AKS-000019 | RFC 6749 1.4; OIDC Core 2 and 3.1.3.7 | Only when the API expects an audience-bound OAuth access token. | OIDC normative control | Fail: cited sections distinguish roles but do not state this MUST NOT force. |
| AKL-000063 | Bearer-token replay exposure | normalized-source-claim | none | concept-global | high | AKS-000018 | RFC 9700 2.2.1 and 4.10.1 | Risk does not make one mechanism universally mandatory. | OAuth security risk | Pass |

All fifteen claims are `sourced` and have direct non-empty source locators.
Lifecycle events LCE-000203 through LCE-000232 record only
automation-authorized `proposed -> source-candidate -> sourced` transitions.
No human-only transition was crossed.

### Material Source-Fidelity Defects

OIDC Core 3.1.3.7 assigns different force and conditions to the fields combined
by AKL-000061:

- issuer and audience validation are mandatory;
- `azp` validation is `SHOULD` when applicable, not an unconditional `MUST`;
- signature validation is mandatory for ID Tokens other than the documented
  direct Token Endpoint case, where TLS server validation may validate the
  issuer in place of checking the token signature;
- expiration is mandatory, while nonce validation is conditional on a nonce
  being sent.

AKL-000061 combines these into one `MUST` statement and records exceptions only
for `azp` presence and nonce. It therefore upgrades `azp` and omits the
direct-Token-Endpoint signature qualification.

AKL-000062 is visibly classified as a medium-confidence, context-only
recommendation, which is better than presenting it as a normalized source
claim. However, its cited sections define the distinct access-token and ID
Token roles; they do not supply the uppercase `MUST NOT` force represented in
the claim and `normative-control` projection.

## Standalone Retrieval Assessment

### OAuth Unit

The OAuth unit directly declares AKS-000017 and AKS-000018 and directly binds
AKL-000049 through AKL-000059 plus AKL-000063. The package preserves PKCE,
redirect, discouraged-grant, refresh replay, sender-constraint, privilege,
audience, recipient-validation, bearer-replay, token-role, and token-format
boundaries without relying on graph adjacency.

Result: structurally standalone and materially complete, with non-blocking
actor-precision issues on AKL-000054 and AKL-000056.

### OIDC Unit

The OIDC unit directly declares AKS-000017, AKS-000018, and AKS-000019. It
directly includes the applicable OAuth claims AKL-000050, AKL-000051,
AKL-000052, AKL-000054, and AKL-000059, plus OIDC claims AKL-000060 through
AKL-000062. It does not depend on the OAuth relationship for evidence, and it
preserves PKCE, loopback redirect, implicit-flow, token-format, authentication,
and authorization boundaries.

Result: adjacency-independent, but not semantically safe for standalone
normative retrieval because AKL-000061 overstates OIDC validation force and
AKL-000062 presents a derived recommendation with source-like MUST NOT force.

## Security Validator Assessment

### Rules Verified

`src/security-claim-validator.ts` correctly rejects:

- unstructured normative security strings;
- unresolved claim IDs;
- claims not declared by the knowledge unit;
- non-sourced claims supporting sourced/drafted security content;
- claim sources not directly declared by the knowledge unit;
- missing source locations for each listed claim source;
- a normative implication statement that differs from its bound claim;
- a normative implication whose claim has no `normative` object.

`src/evidence-validator.ts` also validates locator source resolution,
declaration, and duplicate locator signatures.

### Reproducible Validator Bypasses

Four independent in-memory probes returned no diagnostics:

| Probe | Result |
|---|---|
| Structured statement containing `MUST`, classified as `security-risk`, with empty `claim_ids` | Accepted |
| AKL-000061 `normative.force` changed to `may` and exceptions removed while statement stayed unchanged | Accepted |
| Sourced normative synthesis changed to have no direct source or locator and only a derived claim | Accepted by both security and evidence validators |
| OIDC validation claim attached to the OAuth unit after merely declaring its claim and source | Accepted despite unrelated semantic ownership |

The schema permits empty `claim_ids` for structured kinds other than
`normative-control`, so the first bypass also survives schema validation.
The validator scans normative language only when the implication is a plain
string. It does not require every structured statement containing normative
language to be a claim-bound normative control.

The validator loops over listed claim sources but never requires at least one
direct source for a sourced normative security claim. It compares implication
text with claim text, but does not compare the uppercase normative verb with
`normative.force`, validate exception completeness, or enforce a governed
semantic-owner/applicability boundary.

Purely descriptive structured observations remain valid without unnecessary
claims because the schema allows non-normative kinds with empty `claim_ids`.
That allowance is sound only if normative language is separately prohibited
for those unbound records.

### Negative-Test Assessment

Existing tests genuinely cover unstructured normative prose, undeclared and
adjacent evidence, unresolved claims, proposed claims, missing locators, exact
statement broadening, and production-field assertions for PKCE, redirect
loopback, implicit-flow qualification, sender constraint, access-token format,
ID Token validation, and direct OIDC sources.

They do not independently reject:

- empty `claim_ids` on an actual normative structured record;
- normative language hidden under `security-risk`,
  `implementation-observation`, or `operational-recommendation`;
- a sourced security claim with no direct source but a derived claim;
- `normative.force` disagreement with the statement;
- removed or incomplete `normative.exceptions`;
- a claim from an unrelated semantic boundary;
- removal of an applicable OIDC implication and claim declaration together.

The production assertions are structured rather than phrase-only, but they do
not make the generic validator enforce these contracts.

### Security Mutation Result

The targeted mutation run scored 94.68% total and 100% on covered mutants for
`security-claim-validator.ts`, with 56 killed, 33 timed out, 0 survived, and 5
no-coverage mutants. Relevant no-coverage mutants include the branch that
emits `SECURITY_NORMATIVE_CLAIM_REQUIRED` and the branch that rejects a listed
source whose status is not admitted. The four larger bypasses are missing
logic, so Stryker cannot create mutants for code that does not exist.

## AKR-000010 Assessment

| Property | Verified value |
|---|---|
| Supporting claim | AKL-000030 |
| Claim statement | Local database-to-message boundary only |
| Claim semantic scope | `claim-context-only` |
| Claim confidence | `medium` |
| Relationship subject | AKC-000014, Transactional Outbox |
| Relationship predicate | `improves` |
| Relationship object | AKC-000005, Reliability |
| Relationship semantic scope | `claim-context-only` |
| Relationship confidence | `medium` |
| Relationship strength | `moderate` |
| Conditions | Exact structural equality with AKL-000030 conditions |
| Traversal eligibility | `false` |

AKL-000030 explicitly limits the effect to durable message intent within one
local transaction, requires relay backlog operation, and excludes duplicate
delivery, downstream correctness, and end-to-end Reliability guarantees.
AKR-000010 preserves that condition and states in both notes and traversal
rationale that concept-global use is unsupported.

Final semantic conclusion: the stable relationship ID is safe as a qualified,
non-traversable claim-context record. It is not a concept-global Reliability
fact. M3-REAUD-002 is closed.

## Evidence-Transfer Validator Assessment

The relationship validator contains no reference to AKL-000030, AKR-000010,
Transactional Outbox, or Reliability. Its rules are generic:

| Contract | Independent result |
|---|---|
| Scope monotonicity | Enforced for every evidence claim. |
| Confidence monotonicity | Enforced by ranked comparison for every evidence claim. |
| Strength compatibility | Enforced from claim type, confidence, and conditions. |
| Predicate compatibility | Enforced by exact structured predicate equality. |
| Condition preservation | Every claim condition must occur structurally on the relationship. |
| Subject/object compatibility | Enforced by exact governed endpoint equality. |
| Traversal safety | Requires sourced, concept-global relationships and sourced, aligned evidence. |
| Notes | Notes are not consulted to override structured mismatches. |
| Mixed evidence | Every evidence claim is checked; one narrowing claim rejects the wider edge. |

Relationship negative tests cover scope, confidence, strength, endpoints,
predicate, condition omission, note-based narrowing, proposed/context-only
traversal, mixed evidence, and one positive sourced concept-global traversal.

The targeted mutation run still produced survivors in the strength-ceiling
branches, including mutations around inferential claim types and
medium-confidence or conditioned evidence. The implementation is correct, but
the negative suite does not isolate every strength branch with single-cause
fixtures. This is a test-strength risk, not a current AKR-000010 semantic
defect.

## M3-REAUD-004 Stability Assessment

The targeted changes are narrow:

- `pnpm test:coverage` alone uses `--maxWorkers=2`;
- ordinary `pnpm test` remains parallel;
- the audit-gap regression reuses one baseline only within one test and creates
  replacement records rather than repeatedly loading the repository;
- the human-key suite loads one baseline in `beforeAll` and replaces mutated
  top-level structures;
- no global timeout or coverage/mutation threshold was increased or lowered.

Both required coverage runs passed all 85 tests:

| Run | Duration | Slowest observed individual test | Timeout |
|---|---:|---:|---|
| Coverage 1 | 74.98 s | 4.627 s (`reports.test.ts`) | none |
| Coverage 2 | 67.29 s | 2.976 s | none |

The first run was close to the five-second limit, but the second did not repeat
the margin and hosted coverage had already passed on both operating systems.
This is a non-blocking stability observation.

## Validation Results

All commands used Node.js 24.11.1 and pnpm 10.23.0.

| Command | Actual result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass; lockfile current and dependencies already present. pnpm reported the existing ignored-esbuild-build-script warning. |
| `pnpm format:check` | Pass. |
| `pnpm validate` | Pass; 0 errors and 0 warnings. |
| `pnpm test` | Pass after escaping a Windows sandbox-only `spawn EPERM`; 18 files, 85 tests. |
| `pnpm test:coverage` run 1 | Pass; 85 tests; 94.02% statements, 80.85% branches, 97.98% functions, 94.83% lines. |
| `pnpm test:coverage` run 2 | Pass; identical coverage and 85 tests. |
| `pnpm report:integrity` run 1 | Pass; 12 reports written. |
| `pnpm report:integrity` run 2 | Pass; 12 reports written. |
| `pnpm report:check` | Pass; 12/12 current before this audit document. |
| `git diff --check` | Pass before this audit document. |
| Targeted mutation | Pass threshold; 80.31% total, 84.61% covered score, 521 killed, 144 timed out, 121 survived, 42 no coverage, 0 errors. |

Targeted mutation scores:

| Validator | Total score | Covered score | Killed | Timed out | Survived | No coverage |
|---|---:|---:|---:|---:|---:|---:|
| evidence | 87.02% | 87.69% | 81 | 33 | 16 | 1 |
| Markdown | 58.95% | 68.71% | 110 | 2 | 51 | 27 |
| relationship | 84.75% | 86.63% | 274 | 76 | 54 | 9 |
| security claim | 94.68% | 100.00% | 56 | 33 | 0 | 5 |

The unchanged aggregate break threshold is 60%. The Markdown score alone is
not the blocker. The security contract gaps reproduced by independent probes
are blockers regardless of the aggregate score.

## Findings

### M3-FINAL-001

- **Severity:** High
- **Affected records:** AKL-000061, AKC-000018
- **Evidence:** OIDC Core 3.1.3.7 gives `azp` a qualified SHOULD and permits
  direct Token Endpoint TLS validation in place of checking that ID Token's
  signature; AKL-000061 represents the combined set as MUST with neither
  qualification fully preserved.
- **Problem:** The claim and standalone OIDC projection overstate normative
  force and omit a material flow-specific exception.
- **Impact:** Standalone retrieval can produce false universal OIDC validation
  guidance and reject conforming flow behavior.
- **Required remediation:** Split or rewrite the validation claims so issuer,
  audience, azp, signature, expiration, and nonce each retain their actual
  force and flow conditions; update the structured implication, Markdown, and
  source-fidelity tests.
- **M4 blocking:** yes

### M3-FINAL-002

- **Severity:** High
- **Affected records:** AKL-000062, AKC-000018
- **Evidence:** RFC 6749 1.4 and OIDC Core 2 distinguish access-token and ID
  Token roles but do not state the represented MUST NOT rule.
- **Problem:** A bounded repository recommendation is projected as a sourced
  `normative-control` with stronger force than its cited sections.
- **Impact:** Retrieval can confuse a defensible architecture recommendation
  with protocol-level normative language.
- **Required remediation:** Either cite admitted authority that supplies the
  prohibition and exact conditions, or represent it as clearly authored,
  non-protocol operational guidance with force that does not claim direct
  source normativity.
- **M4 blocking:** yes

### M3-FINAL-003

- **Severity:** High
- **Affected records:** `schemas/knowledge-unit.schema.json`,
  `src/security-claim-validator.ts`, `src/evidence-validator.ts`
- **Evidence:** Four in-memory probes accepted normative kind misclassification
  without claims, force/exception mismatch, a sourced normative claim without
  direct admitted sources, and an unrelated semantic-boundary claim.
- **Problem:** The validator checks adjacency and exact prose but does not
  enforce the complete structured normative/evidence contract.
- **Impact:** Future sourced security knowledge can pass validation while being
  unsafe for standalone retrieval.
- **Required remediation:** Detect normative language across every structured
  kind; require claim bindings and direct admitted sources for material
  normative guidance; align statement verbs, force, conditions, and
  exceptions; and add a governed semantic applicability rule for cross-unit
  claim reuse.
- **M4 blocking:** yes

### M3-FINAL-004

- **Severity:** Medium
- **Affected records:** `tests/security-claim.test.ts`,
  `tests/m3-semantic-remediation.test.ts`
- **Evidence:** Required branches for empty normative claim bindings and
  inadmissible direct sources have no mutation coverage; the four reproduced
  bypasses have no negative regressions.
- **Problem:** Production assertions catch selected record drift but do not
  prove the generic validator rejects the full failure matrix.
- **Impact:** Retrieval-safety regressions can remain green.
- **Required remediation:** Add isolated negative tests for every reproduced
  bypass and for removal of directly applicable OIDC controls.
- **M4 blocking:** yes, as part of M3-FINAL-003 remediation

### M3-FINAL-005

- **Severity:** Low
- **Affected records:** AKL-000054, AKL-000056
- **Evidence:** RFC 9700 names clients for the implicit-flow SHOULD NOT and
  authorization/resource servers for sender constraint; the records use the
  broader actor `OAuth deployments`.
- **Problem:** Target-actor precision is lower than the source.
- **Impact:** Human interpretation is slightly less actionable, although force
  and material qualifiers are preserved.
- **Required remediation:** Narrow `applies_to` and statements to the source
  actors during the blocker remediation.
- **M4 blocking:** no by itself

### M3-FINAL-006

- **Severity:** Observation
- **Affected records:** relationship negative tests and mutation execution
- **Evidence:** Relationship strength-ceiling mutants survived; the local
  mutation run timed out 144 mutants, while both coverage runs completed.
- **Problem:** Some strength branches lack isolated tests and local mutation
  execution is resource-sensitive.
- **Impact:** Maintainability and diagnostic precision risk; no current
  AKR-000010 widening was found.
- **Required remediation:** Add single-cause medium-confidence and inferential
  strength fixtures incrementally; monitor mutation timeouts.
- **M4 blocking:** no

## Residual Risks

### Blockers

- AKL-000061 does not preserve OIDC signature and azp force/conditions.
- AKL-000062 projects a derived recommendation with unsupported MUST NOT force.
- The security schema/validator accepts four reproduced retrieval-unsafe
  structured states.
- Required negative tests do not close those bypasses.

### Non-Blockers

- AKL-000054 and AKL-000056 use broader actor terminology than RFC 9700.
- Markdown mutation score remains below 60% individually but above the
  unchanged aggregate gate; no Markdown survivor was found that repairs the
  security-validator blockers.
- Relationship strength-ceiling tests can be more isolated even though current
  enforcement and AKR-000010 are correct.
- One coverage run approached the timeout once; the second run and hosted
  runners were stable.
- Source locators remain governed strings rather than typed section
  references.

## Final Verdict

HOLD M4
