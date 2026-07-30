# M3 Focused Retrieval-Safety Hardening Report

Run window: 2026-07-30 through 2026-07-31, Asia/Jakarta
Scope: M3 focused hardening for M3-REAUD-001 and M3-REAUD-002 only

## Baseline

- Starting HEAD: `fbc0eb2395c95ea77a375edb4447b6f91135bf21`.
- Starting branch: `main`.
- Starting divergence: `origin/main...HEAD` was `0 0`.
- Starting worktree: non-clean, containing the complete uncommitted M3 semantic remediation across claims, relationships, knowledge units, schemas, validators, tests, and audit reports. That work was inspected and preserved; no reset or discard was performed.
- Runtime: Node.js `24.11.1`; pnpm `10.23.0`.
- Implementation baseline commit: `504120820437f368fd1988bb1621138c26c0d2cf` on `main`.
- Source governance: no source admission state was changed. AKS-000017, AKS-000018, and AKS-000019 remain the already admitted authorities used by this hardening.
- Lifecycle boundary: new claims advanced only through automation-authorized `proposed -> source-candidate -> sourced` events. No content was marked human-reviewed, reviewed, approved, published, or canonical.

## Finding Disposition

### M3-REAUD-001

Implemented and ready for focused independent re-audit. OAuth and OIDC security controls are represented by narrow first-class claims with direct admitted source IDs, source locators, semantic scope, confidence, and structured normative force and exceptions where applicable. `security_implications` can now carry governed kind and claim bindings. The validator rejects unstructured normative security prose, unresolved or undeclared claims, non-sourced support, source adjacency without direct declaration, missing source locations, and normative statement broadening.

OIDC directly declares AKS-000017, AKS-000018, and AKS-000019 and directly binds the applicable OAuth claims. It no longer relies on a related OAuth concept to carry RFC 9700 evidence. No new candidate source was required.

The governed security implication kinds are:

- `normative-control`: a MUST, MUST NOT, SHOULD, SHOULD NOT, RECOMMENDED, or MAY behavior whose exact statement and force model are claim-bound;
- `security-risk`: a sourced harmful condition or exposure that does not itself manufacture a universal mandate;
- `implementation-observation`: descriptive protocol or mechanism semantics without added normative force;
- `operational-recommendation`: contextual operational advice, which requires a claim when it materially directs security behavior.

### M3-REAUD-002

Implemented and ready for focused independent re-audit. AKR-000010 retains its stable ID but is now `claim-context-only`, medium confidence, moderate strength, and non-traversable. Its condition exactly preserves AKL-000030's local database-to-message boundary, and its rationale states that the evidence cannot support concept-global traversal. The relationship does not claim end-to-end reliability.

The reusable relationship validator now applies evidence-transfer rules to every evidence claim rather than hard-coding AKR-000010. It enforces subject, object, predicate, condition, confidence, semantic-scope, strength, sourced-evidence, and traversal monotonicity. Notes cannot override a structured mismatch, and one narrowing claim in a multi-claim evidence set rejects the wider edge.

No one-off quality-aspect concept was introduced because the current source set does not establish a separately reusable, independently measurable identity for the local outbox durability boundary.

### M3-REAUD-003

Reproducibility evidence is present. The implementation baseline is commit `504120820437f368fd1988bb1621138c26c0d2cf`, pushed to `origin/main` with local divergence `0 0` and a clean worktree before this report-only attestation. GitHub Actions run `30569237983` checked out that commit from Git and completed successfully:

- `validate (ubuntu-latest)`: success;
- `validate (windows-latest)`: success;
- `mutation`: success.

Run URL: `https://github.com/anshacerbia2/architecture-knowledge/actions/runs/30569237983`.

### M3-REAUD-004

The timeout recurred during coverage under unrestricted file parallelism. The first recurrence was the known repository-loading path in `audit-gap-regressions.test.ts`; later contention moved the timeout to schema and registry tests. Targeted performance work was therefore necessary:

- the affected audit regression test now loads one baseline model and creates immutable variants;
- the human-key schema suite loads one shared baseline rather than three full repositories;
- only the coverage script is capped at two workers to prevent concurrent full-repository loads from exhausting the five-second per-test margin.

No global test timeout was increased, no coverage or mutation threshold was lowered, and ordinary tests remain parallel. The final coverage run passed all 85 tests in 36.51 seconds with no timeout.

## Security Claim Matrix

| Control or boundary | Claim ID | Claim type | Source and section | Knowledge unit | Structured binding | Qualifier preserved |
|---|---|---|---|---|---|---|
| Public versus confidential client capability | AKL-000049 | normalized-source-claim | AKS-000017, RFC 6749 2.1 | OAuth | `security_implications` | Public clients cannot keep credentials confidential; confidential status remains deployment-bound. |
| Public-client PKCE | AKL-000050 | normalized-source-claim | AKS-000018, RFC 9700 2.1.1 | OAuth and OIDC | `security_implications` | MUST; no optional downgrade. |
| Confidential-client token-endpoint authentication | AKL-000051 | synthesis | AKS-000017, RFC 6749 2.3 and 3.2.1 | OAuth and OIDC | `security_implications` | MUST use the registered method; selected profiles may be stricter. |
| Redirect URI comparison | AKL-000052 | normalized-source-claim | AKS-000018, RFC 9700 2.1 and 4.1.3 | OAuth and OIDC | `security_implications` | Exact matching remains the general rule; only the native localhost loopback port may vary. |
| Resource owner password credentials grant | AKL-000053 | normalized-source-claim | AKS-000018, RFC 9700 2.4 | OAuth | `security_implications` | MUST NOT. |
| Implicit and authorization-response access-token flows | AKL-000054 | normalized-source-claim | AKS-000018, RFC 9700 2.1.2 | OAuth and OIDC | `security_implications` | SHOULD NOT, with the injection-prevention and leakage-mitigation exception preserved. |
| Public-client refresh-token replay defense | AKL-000055 | normalized-source-claim | AKS-000018, RFC 9700 2.2.2 and 4.14.2 | OAuth | `security_implications` | MUST rotate or sender-constrain, detect replay, and revoke the active token on replay. |
| Access-token sender constraint | AKL-000056 | normalized-source-claim | AKS-000018, RFC 9700 2.2.1 and 4.10.1 | OAuth | `security_implications` | SHOULD; mTLS and DPoP remain contextual, with architecture/performance exceptions. |
| Access-token least privilege and audience | AKL-000057 | normalized-source-claim | AKS-000018, RFC 9700 2.3 | OAuth | `security_implications` | SHOULD minimize privilege and audience. |
| Intended-recipient validation | AKL-000058 | normalized-source-claim | AKS-000018, RFC 9700 2.3 | OAuth | `security_implications` | Resource server MUST validate and reject mismatch. |
| OAuth access-token role and format | AKL-000059 | synthesis | AKS-000017, RFC 6749 1.4 | OAuth and OIDC | `security_implications` | Authorization credential; OAuth does not make every access token a JWT. |
| OIDC ID Token role | AKL-000060 | normalized-source-claim | AKS-000019, OIDC Core 2 | OIDC | `security_implications` | JWT authentication assertion for its intended relying party. |
| ID Token validation | AKL-000061 | normalized-source-claim | AKS-000019, OIDC Core 2 and 3.1.3.7 | OIDC | `security_implications` | MUST validate issuer, audience, applicable azp, signature, time, and nonce when sent. |
| ID Token API credential boundary | AKL-000062 | recommendation | AKS-000017 1.4 and AKS-000019 2 and 3.1.3.7 | OIDC | `security_implications` | MUST NOT substitute an ID Token where the API expects an audience-bound OAuth access token. |
| Bearer-token replay exposure | AKL-000063 | normalized-source-claim | AKS-000018, RFC 9700 2.2.1 and 4.10.1 | OAuth | `security_implications` as `security-risk` | Replay risk is explicit without making one sender-constraining mechanism universally mandatory. |
| OAuth authorization boundary | AKL-000017 | synthesis | AKS-000017 1.1 and 1.4; AKS-000018 1.2 | OAuth | unit `claims` | Authorization is not silently converted into end-user authentication. |
| OIDC identity layer | AKL-000018 | normalized-source-claim | AKS-000019 1 and 2 | OIDC | unit `claims` | Authentication and identity semantics do not grant application authorization. |
| OAuth/OIDC token-role boundary | AKL-000033 | synthesis | AKS-000017 1.4; AKS-000019 1 and 2 | OAuth and OIDC | unit `claims` and AKR-000013 evidence | Authentication assertions and authorization credentials remain non-interchangeable. |
| OIDC protocol dependency | AKL-000034 | normalized-source-claim | AKS-000019 1 | OIDC | unit `claims` and AKR-000014 evidence | OIDC uses OAuth mechanisms without inheriting evidence through adjacency. |

## Relationship Transfer Matrix

| Supporting claim | Claim scope | Claim confidence | Relationship scope | Relationship confidence | Predicate | Strength | Traversal | Final rationale |
|---|---|---|---|---|---|---|---|---|
| AKL-000030 | claim-context-only | medium | claim-context-only | medium | improves | moderate | false | Only the conditioned local database-to-message durability boundary is represented; no end-to-end or concept-global Reliability improvement is traversable. |

## Files Changed

The implementation commit changes the following complete sets:

- Claims: `claims/AKL-000001.yaml` through `claims/AKL-000063.yaml`; AKL-000049 through AKL-000063 are new, and all existing claims receive explicit semantic scope.
- Relationships: `relationships/AKR-000001.yaml` through `relationships/AKR-000024.yaml`.
- Knowledge units: all 24 production units under `knowledge/`; the security path moves from `knowledge/security/oauth-2x.md` to `knowledge/security/oauth-2-0-authorization-framework.md`, and `knowledge/security/openid-connect.md` is revised.
- Schemas: `schemas/_defs.schema.json`, `schemas/claim.schema.json`, `schemas/kernel-registry.schema.json`, `schemas/knowledge-unit.schema.json`, `schemas/relationship.schema.json`, and `schemas/validation-policies.schema.json`.
- Ontology and policy: `ontology/concept-types.yaml`, `ontology/quality-attributes.yaml`, `ontology/relationship-types.yaml`, and `validation/policies.yaml`.
- Validators: `src/evidence-validator.ts`, `src/markdown-validator.ts`, `src/relationship-validator.ts`, and new `src/security-claim-validator.ts`.
- Governance and identity: `governance/lifecycle-events.yaml` and `ids/ledger.yaml`.
- Tests: `tests/audit-gap-regressions.test.ts`, `tests/evidence.test.ts`, `tests/human-key.test.ts`, `tests/m3-semantic-remediation.test.ts`, `tests/markdown.test.ts`, `tests/relationship.test.ts`, and `tests/security-claim.test.ts`.
- Fixtures: `tests/fixtures/valid/claim.yaml`, `tests/fixtures/valid/knowledge.md`, and `tests/fixtures/valid/relationship.yaml`.
- Tooling: `package.json`, `stryker.config.json`, and `vitest.config.ts`.
- Integrity reports: `generated/integrity/lifecycle-distribution.json`, `markdown-link-integrity.json`, `ontology-vocabulary-coverage.json`, `schema-coverage.json`, `source-usage.json`, `summary.json`, and `unresolved-references.json`.
- M3 records and reports: `docs/adr/0003-m3-semantic-model-remediation.md`, `docs/m3-semantic-audit-report.md`, `docs/m3-semantic-remediation-report.md`, `docs/m3-independent-semantic-reaudit-report.md`, and this `docs/m3-focused-hardening-report.md`.

## Validation Results

- `pnpm install --frozen-lockfile`: pass; lockfile current, pnpm 10.23.0.
- `pnpm format:check`: pass; all governed formatted files matched.
- `pnpm validate`: pass; schema, vocabulary, IDs, sources, claims, relationships, lifecycle, Markdown, and links reported 0 errors and 0 warnings.
- `pnpm test`: pass; 18 files and 85 tests.
- `pnpm test:coverage`: pass; 85 tests, 94.02% statements, 80.85% branches, 97.98% functions, and 94.83% lines.
- `pnpm report:integrity` first pass: 12 reports written.
- `pnpm report:integrity` second pass: 12 reports written.
- `pnpm report:check`: pass; 12 of 12 current.
- `git diff --check`: pass.
- Targeted mutation for `evidence-validator.ts`, `markdown-validator.ts`, `relationship-validator.ts`, and `security-claim-validator.ts`: pass at 81.04% aggregate. Per file: evidence 88.55%, Markdown 63.68%, relationship 85.23%, security 87.23%. The unchanged break threshold remains 60%.
- Hosted clean-checkout run `30569237983` on implementation commit `504120820437f368fd1988bb1621138c26c0d2cf`: overall success; Ubuntu success; Windows success; mutation success.

## Remaining Risks

- The Markdown validator has the lowest targeted mutation score at 63.68%. It remains above the enforced threshold, but its legacy heading and link branches should receive incremental negative-test coverage.
- Source locations are governed non-empty strings rather than a normalized locator vocabulary. Current security claims are exact and tested, but later source families may require typed locator schemes.
- The two High findings have been implemented but still require the requested focused independent re-audit; this report does not grant human review or canonical status.
- Coverage stability now depends on the intentional two-worker cap because many suites load the complete repository. Future growth should consider a read-only parsed-model cache or narrower fixture loaders without weakening isolation.

## Exit Verdict

READY FOR FOCUSED M3 RE-AUDIT
