# M3 Independent Semantic Re-audit

Audit date: 2026-07-30
Audit role: independent architecture, ontology, evidence, security, and retrieval-safety review
Git baseline: `fbc0eb2395c95ea77a375edb4447b6f91135bf21` plus the uncommitted M3 remediation worktree

This is an audit artifact only. It does not mark any source, claim, relationship,
knowledge unit, recommendation, or architecture decision as human-reviewed,
approved, published, or canonical.

## Executive verdict

**HOLD M4**

The remediation closes most of M3-AUD-001 through M3-AUD-016 and materially
improves the corpus. Taxonomy, terminology, condition scoping, weak-edge
exclusion, structured context, and failure-mode attribution are now coherent.

Two High retrieval-safety findings remain:

1. OAuth/OIDC normative controls are not represented as first-class,
   source-bound claims, and two RFC 9700 qualifiers are incomplete.
2. AKR-000010 promotes a deliberately local dual-write claim into a strong,
   concept-global, traversal-eligible relationship to Reliability.

Green automation does not detect either issue because the remediation contract
checks field and phrase presence, while the relationship gate checks lifecycle
and claim class but not semantic transfer scope.

## Scope and method

The re-audit inspected:

- all 24 knowledge units;
- all 48 claims;
- all 24 relationships, including all 9 traversal-eligible edges;
- the 22 admitted evidence sources and their registry boundaries;
- all 15 formerly Qualified claim dispositions;
- all 8 weak relationships identified by M3-AUD-012;
- every relationship condition with an empty `concept_ids` list;
- dependability terminology and concept-type migrations;
- security-sensitive schemas, validators, and remediation tests;
- lifecycle state and generated integrity reports.

External fidelity checks used the admitted primary or official sources, including
[RFC 9110 section 9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2),
[RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html),
[OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html),
the [AWS Transactional Outbox guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html),
the [Azure Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry),
the [Azure Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker),
the [Azure Saga pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga),
and the [Azure Event-Driven Architecture guide](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven).

## Corpus state

| Record family | Count | Lifecycle distribution |
|---|---:|---|
| Knowledge units | 24 | 20 `drafted`, 4 `proposed` |
| Claims | 48 | 40 `sourced`, 8 `proposed` |
| Relationships | 24 | 20 `sourced`, 4 `proposed` |
| Traversal-eligible relationships | 9 | all `sourced` |
| Relationship conditions | 24 | all explicitly `edge-local` |

No content is at `human-review`, `reviewed`, or `published`.

## Findings

### M3-REAUD-001 - normative OAuth/OIDC controls are not claim-grounded

- **Severity:** High
- **Category:** security, claim/evidence governance, standalone retrieval
- **Affected records:** AKC-000017, AKC-000018, AKL-000017, AKL-000018,
  AKL-000033, AKL-000034
- **Affected files:** `knowledge/security/oauth-2-0-authorization-framework.md`,
  `knowledge/security/openid-connect.md`, `schemas/knowledge-unit.schema.json`,
  `tests/m3-semantic-remediation.test.ts`
- **M4 blocking:** yes

The OAuth unit now contains important RFC 9700 controls for PKCE, redirect URI
matching, refresh-token replay protection, sender constraint, discouraged
grants, audience restriction, and client classification. Those controls remain
plain prose or plain `security_implications` strings. The two first-class claims
owned by AKC-000017 cover only the authorization boundary and the OIDC token-role
boundary; they do not state or source the individual normative controls.

This conflicts with the repository rule that significant factual and normative
statements require first-class claims. The knowledge schema cannot express a
source or claim reference per `security_implications` item, and the remediation
test verifies only that selected phrases exist.

The OIDC unit also applies current OAuth security behavior in its runtime and
security sections, but its structured `sources` list contains only AKS-000019.
Its prose says RFC 9700 support is carried through the related OAuth unit. That
depends on adjacency and is unsafe for standalone retrieval.

Two fidelity issues remain inside the otherwise improved prose:

- unqualified exact redirect URI matching omits RFC 9700's native-app loopback
  redirect exception;
- saying the implicit grant is "not the default" is weaker than RFC 9700's
  `SHOULD NOT` guidance unless the documented mitigations are in place.

**Required correction:** create narrowly scoped claims for each material
normative control cluster and bind them to AKS-000018 or AKS-000019 as
appropriate. Preserve RFC qualifiers and exceptions, add the applicable RFC 9700
evidence to the OIDC record or remove transferred normative prose, and add a
validator/test that security-sensitive normative metadata resolves to
first-class evidence-bearing claims.

### M3-REAUD-002 - AKR-000010 widens a local claim into a global quality edge

- **Severity:** High
- **Category:** relationship semantics, source transfer, graph traversal
- **Affected records:** AKC-000014, AKL-000030, AKR-000010, AKC-000005
- **Affected files:** `src/relationship-validator.ts`,
  `tests/relationship.test.ts`, `tests/m3-semantic-remediation.test.ts`
- **M4 blocking:** yes

AKL-000030 is correctly narrowed to one failure case within the local
database-to-message-intent boundary. Its note explicitly says it does not
establish end-to-end system reliability. AWS supports atomic local recording,
the dual-write failure boundary, and duplicate-delivery caveats.

AKR-000010 nevertheless records:

- predicate `improves`;
- object AKC-000005, the full Reliability concept;
- strength `strong`;
- confidence `high`;
- semantic scope `concept-global`;
- traversal eligibility `true`.

That representation is broader and stronger than its medium-confidence
synthesis evidence. A future traversal can therefore produce "Transactional
Outbox improves Reliability" even though the evidence deliberately limits the
claim to durable message intent and separates consumer correctness, duplicate
handling, relay availability, and end-to-end service reliability.

The validator blocks inferential or recommendation evidence for traversable
quality impacts, but accepts any sourced synthesis and does not compare claim
scope, confidence, statement object, relationship strength, or traversal scope.

**Required correction:** either make AKR-000010 claim-context-only and exclude it
from traversal, or introduce a precise reusable quality aspect for the local
dual-write/message-intent boundary and target that concept. Add regression
coverage that rejects a relationship whose graph scope or strength exceeds its
evidence claim.

### M3-REAUD-003 - current remediation is not reproducible from Git HEAD

- **Severity:** Medium
- **Category:** release integrity
- **M4 blocking:** yes for a clean-checkout M4 baseline; no for this semantic
  review

The re-audited state exists as a large uncommitted worktree over
`fbc0eb2395c95ea77a375edb4447b6f91135bf21`. A clean checkout of HEAD does not
contain the remediation or this report. Before opening M4, commit the final M3
state and reproduce the validation baseline from that commit on Linux and
Windows. This is version-history evidence, not a substitute for either semantic
review or the integrity ledger.

### M3-REAUD-004 - one coverage run exceeded the five-second test timeout

- **Severity:** Low
- **Category:** test stability
- **M4 blocking:** no

The first coverage run timed out in
`audit-gap-regressions.test.ts` while its ordinary test run passed. An immediate
isolated coverage rerun passed all 72 tests, with the affected test completing in
3.888 seconds. This is a transient performance margin risk, not a functional
failure. Monitor it in CI; do not hide a recurrence by broadly increasing every
timeout.

## Original finding disposition

| Original finding | Re-audit disposition |
|---|---|
| M3-AUD-001 | Closed: sourced QAS claim is narrowed; the six-field form is explicit corpus synthesis. |
| M3-AUD-002 | Closed: Idempotency is a semantic-property umbrella with contextual roles; AKR-000005 is excluded. |
| M3-AUD-003 | Closed: public operational definitions and a non-causal conditioned overlap replace the unsupported hierarchy/causality. |
| M3-AUD-004 | Closed: Observability uses a non-causal, non-traversable investigation predicate. |
| M3-AUD-005 | Closed: Eventual Consistency is a `consistency-model`. |
| M3-AUD-006 | Closed: terminal failure modes no longer require fabricated peer failure modes. |
| M3-AUD-007 | **Reopened by M3-REAUD-001:** content breadth improved, but normative grounding and two RFC qualifiers remain incomplete. |
| M3-AUD-008 | Closed: AKC-000017 has an explicit OAuth 2.0 framework/BCP/extension boundary and retains its stable ID. |
| M3-AUD-009 | Closed for production traversal: failure modes are the actors; proposed edges remain excluded. |
| M3-AUD-010 | Closed for the current corpus: all 144 structured context statements are non-empty and no exact boilerplate duplicate was found. |
| M3-AUD-011 | Closed at claim level; AKL-000030's downstream widening is separately reopened by M3-REAUD-002. |
| M3-AUD-012 | Closed: every named weak relationship is excluded from traversal. |
| M3-AUD-013 | Closed: all 24 conditions are explicitly edge-local; no current condition justifies a reusable concept. |
| M3-AUD-014 | Closed: Availability, Reliability, Resilience, Fault Tolerance, and Recoverability have governed non-synonym boundaries. |
| M3-AUD-015 | Closed: Related Concepts sections are concept-specific and the generic boilerplate is rejected. |
| M3-AUD-016 | Accepted design: one primary type is retained and contextual roles carry legitimate secondary semantics. |

## Cross-domain and ontology assessment

The ontology supports cross-domain relationships without using domain labels as
types. OIDC-to-OAuth, Microservices-to-EDA, architecture-practice-to-artifact,
and quality-to-pattern relationships all resolve through registered predicates
and claims.

The new `semantic-property` and `consistency-model` types correct the two clearest
abstraction-level errors. Contextual roles prevent Modular Monolith,
Observability, Idempotency, and OAuth from acquiring multiple competing primary
types.

The condition review is defensible: all 24 conditions qualify a single edge and
none currently has demonstrated stable identity and reuse. Creating generic
constraint nodes would reduce information quality.

The remaining ontology risk is relationship target granularity. Quality
attributes are broad concepts, so a local mechanism can accidentally acquire a
global quality edge unless the model supports narrower measurable aspects or
strict claim-context traversal.

## Validation results

| Command | Result |
|---|---|
| `pnpm format:check` | Pass |
| `pnpm validate` | Pass: 0 errors, 0 warnings |
| `pnpm test` | Pass: 17 files, 72 tests |
| `pnpm test:coverage` | First run: one timeout; immediate rerun passed 17 files and 72 tests |
| Coverage | 96.04% statements, 83.14% branches, 99.12% functions, 97.07% lines |
| `pnpm report:check` | Pass: 12/12 reports current before this audit-only document |
| `git diff --check` | Pass; Git emitted only the existing CRLF-to-LF notice for `validation/policies.yaml` |

The automated gates establish structural integrity. They do not overturn the
two High semantic findings.

## Assumptions and unresolved questions

- M4 traversal is assumed to expose concept-level edges independently of the
  full evidence note. If M4 guarantees atomic retrieval of edge, conditions,
  claim statement, and claim notes, AKR-000010's risk is reduced but not removed.
- A source list on a whole knowledge unit is not treated as sufficient evidence
  binding for multiple independent normative security controls.
- It remains unresolved whether security implication items should directly
  carry `claim_ids`, or whether the unit should only reference claims while the
  prose remains a projection.
- It remains unresolved whether local quality effects need first-class
  measurable-aspect concepts or a narrower relationship scope than
  `concept-global`.

## Required next run

Keep the next run in **M3 hardening**, not M4:

1. remediate M3-REAUD-001 and M3-REAUD-002 without promoting lifecycle state;
2. add negative tests for normative-security claim grounding and relationship
   scope/strength transfer;
3. rerun the full pnpm baseline and integrity checks;
4. perform a focused independent re-audit of only the two High findings;
5. commit the completed M3 baseline and prove clean-checkout Linux and Windows
   CI.

M4 may open only after both High findings are closed and the audited M3 state is
reproducible from a committed baseline.
