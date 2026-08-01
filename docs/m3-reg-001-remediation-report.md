# M3-REG-001 Focused Normative Claim Classification Remediation

Date: 2026-08-02

## Executive Summary

M3-REG-001 was remediated. A structured security implication can no longer bind
a resolved claim containing structured `normative` metadata unless the
implication kind is `normative-control`. The decision is independent of modal
word casing and statement wording. The existing lexical RFC-force guard remains
active as defense-in-depth for normative prose without a first-class claim.

This run did not change lifecycle states or begin any later milestone. The exit
statement authorizes only another independent M3 regression re-audit.

## Root Cause

The validator originally derived `statementForces` from uppercase RFC-style
tokens. It emitted `SECURITY_NORMATIVE_KIND` when a non-normative implication
kind contained those tokens, but the complete normative checks were gated by
`kind === "normative-control"`.

Consequently, an implication could retain a normative claim binding while being
reclassified as `security-risk`, `implementation-observation`, or
`operational-recommendation`. Lowercase or neutral prose avoided the lexical
guard, and the incorrect kind prevented entry into the normative-validation
branch. Claim metadata was present but was not used as the primary
classification authority.

## Enforcement Rule

For every resolved claim referenced by a structured security implication:

```text
claim.data.normative exists
-> implication.kind must equal "normative-control"
```

Violations emit `SECURITY_NORMATIVE_KIND`. The diagnostic identifies the actual
implication kind, the normative claim ID, and the required `normative-control`
kind. This rule does not depend on casing, modal keywords, statement wording,
source adjacency, relationship adjacency, claim ownership, or cross-concept
applicability.

The pre-existing lexical check is unchanged. Uppercase protocol force under a
non-normative kind still fails even when `claim_ids` is empty. All existing
normative-control checks for resolution, declaration, applicability, lifecycle,
source admission, locator presence, domain scope, claim type, exact statement,
force, conditions, exceptions, and complete projection remain active.

Descriptive implications remain valid when they are genuinely non-normative.
The regression suite covers both unbound descriptive implications and a
descriptive implication bound to a non-normative descriptive claim.

## Files Changed

| File | Purpose |
|---|---|
| `src/security-claim-validator.ts` | Enforce metadata-driven implication classification for every resolved bound normative claim. |
| `tests/security-claim.test.ts` | Add lowercase, neutral, recommendation, descriptive, lexical, valid projection, and production regressions. |
| `claims/AKL-000056.yaml` | Correct the RFC 9700 locator without changing claim semantics or lifecycle. |
| `docs/m3-reg-001-remediation-report.md` | Record the focused remediation, evidence, provenance, and bounded exit statement. |
| `generated/integrity/markdown-link-integrity.json` | Regenerate the governed Markdown-file count after adding this report. |

Regenerating after the locator correction produced no generated-file diff.
Adding this report increased the governed Markdown-file count from 63 to 64;
the link report records 14 checked links and zero broken links.

## Regression Test Matrix

| Scenario | Expected result | Actual result |
|---|---|---|
| `security-risk` + lowercase prose + normative claim | Reject | Rejected with `SECURITY_NORMATIVE_KIND`. |
| `security-risk` + neutral prose + normative claim | Reject | Rejected with `SECURITY_NORMATIVE_KIND`. |
| `implementation-observation` + lowercase prose + normative claim | Reject | Rejected with `SECURITY_NORMATIVE_KIND`. |
| `implementation-observation` + neutral prose + normative claim | Reject | Rejected with `SECURITY_NORMATIVE_KIND`. |
| `operational-recommendation` + normative claim | Reject | Rejected with `SECURITY_NORMATIVE_KIND`; existing recommendation-model validation also remains active. |
| Descriptive unbound `security-risk` | Accept | Accepted with no security diagnostic. |
| Descriptive unbound `implementation-observation` | Accept | Accepted with no security diagnostic. |
| Valid `normative-control` projection | Accept | Accepted when statement, force, evidence, conditions, exceptions, applicability, and status are valid. |
| Uppercase normative prose without claim | Reject | Rejected by the existing lexical `SECURITY_NORMATIVE_KIND` defense. |

Additional boundary coverage confirms that a descriptive `security-risk` may
bind a genuinely non-normative descriptive claim. The production repository
regression loads the real model and confirms
`validateSecurityClaimBindings(model) === []`.

## AKL-000056 Locator Correction

Old locator:

```text
RFC 9700 Sections 2.2.1 and 4.10.1
```

New locator:

```text
RFC 9700 Sections 2.2.1 and 4.10
```

Section 2.2.1 supports the authorization-server and resource-server `SHOULD`.
The architecture/performance qualification occurs in the introductory text of
Section 4.10, so Section 4.10.1 alone was too narrow. The correction did not
change the claim force, actor, exception meaning, status, subject,
applicability, source ID, or identifier.

## Command Results

| Command or gate | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass; lockfile current and dependencies already installed with pnpm 10.23.0. The existing ignored-esbuild-build-script notice was unchanged. |
| `pnpm format:check` | Pass; all matched files use Prettier formatting. |
| `pnpm validate` | Pass; typecheck plus schema, vocabulary, IDs, sources, claims, relationships, lifecycle, Markdown, and links produced 0 errors and 0 warnings. |
| `pnpm report:integrity` | Pass; regenerated 12 deterministic reports. The final run updated only the governed Markdown-file count for this report. |
| `pnpm report:check` | Pass; 12/12 reports current. |
| Focused security test | Pass; 1 file and 36/36 tests. |
| `pnpm test`, run 1 | Pass; 18 files and 127/127 tests in 20.68 seconds. |
| `pnpm test`, run 2 | Pass; 18 files and 127/127 tests in 19.17 seconds. |
| `pnpm test:coverage` | Pass; 94.52% statements, 81.73% branches, 98.13% functions, and 95.38% lines. |
| Focused security mutation | Pass; 92.53% total, 94.89% covered, 198 killed, 25 timed out, 12 survived, 6 no coverage, 0 errors. |
| Ubuntu hosted validation | Success; job `91422345800`. |
| Windows hosted validation | Success; job `91422345768`. |
| Hosted mutation | Success; job `91422345798`. |

The focused security mutation baseline measured by the independent audit was
85.90%. The remediated focused score is 92.53%, so the focused score did not
regress. The configured break threshold remained unchanged at 60%.

The two complete deterministic test runs produced the same test-file and test
counts with no failures. Coverage also executed the same 127-test suite.

## Provenance

| Item | Value |
|---|---|
| Implementation commit | `6eee0ba6c17c6554cceefc6646a343e3a8bab218` |
| Hosted workflow | `30720103773` |
| Hosted workflow URL | `https://github.com/anshacerbia2/architecture-knowledge/actions/runs/30720103773` |
| Hosted workflow head SHA | `6eee0ba6c17c6554cceefc6646a343e3a8bab218` |
| Ubuntu job and tested SHA | `91422345800`; implementation SHA above; success. |
| Windows job and tested SHA | `91422345768`; implementation SHA above; success. |
| Mutation job and tested SHA | `91422345798`; implementation SHA above; success. |
| Workflow conclusion | Success. |
| Report commit SHA | Recorded in the release handoff after this document is committed. |
| Final HEAD | Recorded in the release handoff after the report commit is pushed. |
| Final remote divergence | Recorded in the release handoff after the report commit is pushed. |
| Final worktree status | Recorded in the release handoff after the report commit is pushed. |

The hosted workflow completed at 2026-08-01T22:31:28Z. Ubuntu completed at
2026-08-01T21:55:37Z, Windows at 2026-08-01T21:56:40Z, and mutation at
2026-08-01T22:31:27Z.

A commit cannot embed its own SHA without changing that SHA. Following the
repository's existing provenance practice, the report commit, final HEAD,
divergence, and worktree facts are therefore emitted in the post-commit release
handoff rather than fabricated inside this self-referential document. No hosted
CI provenance is claimed for the later report commit unless a workflow actually
runs on that exact SHA.

## Residual Findings

No Critical or High finding remains within the focused M3-REG-001 scope.

- Low: Twelve focused security-validator mutants survived. The survivor in the
  new rule changes diagnostic fallback text rather than classification behavior;
  tests protect the stable diagnostic code but do not yet assert every message
  field. Other survivors are pre-existing force, qualification, and exact-text
  assertion-strength opportunities.
- Low: Twenty-five focused mutants timed out locally and count as detected under
  Stryker semantics. Hosted full mutation passed without threshold changes, but
  mutation runtime remains an operational maintenance cost.
- Low: Source locators remain governed free-form strings rather than typed
  section references, so locator precision still benefits from human source
  fidelity review.

## Exit Statement

READY FOR FINAL M3 REGRESSION RE-AUDIT
