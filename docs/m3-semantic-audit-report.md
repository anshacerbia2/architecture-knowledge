# M3 Independent Semantic and Content Audit

Audit date: 2026-07-29
Audit role: independent architecture, ontology, evidence, security, and technical-content review
Repository baseline: `fbc0eb2395c95ea77a375edb4447b6f91135bf21`

## Executive Verdict

**HOLD M4**

The M3 corpus is structurally complete and substantially useful to a human reader, but it is not yet safe for graph generation or context-independent retrieval. Ten High findings remain. The principal blockers are source-to-claim mismatches, two incorrect primary concept types, a causal/taxonomic ambiguity between reliability and availability, unsupported quality-impact edges, incomplete OAuth/OIDC security guidance, failure modes attributed to the wrong actor, an invalid recursive failure-mode validation rule, and critical context present only in prose rather than structured metadata.

No content was marked reviewed, approved, published, or canonical. This audit did not change production knowledge, claims, relationships, sources, ontology, validation policy, or lifecycle state.

## Audit Scope

The audit inspected:

- all 20 drafted reference units under `knowledge/`;
- all 4 proposed supporting failure-mode units under `knowledge/supporting/`;
- all 48 claim records under `claims/`:
  - 40 sourced claims;
  - 8 proposed claims;
- all 24 relationship records under `relationships/`:
  - 20 sourced relationships;
  - 4 proposed relationships;
- all 22 admitted source records in `sources/registry.yaml`;
- the source-quality rubric and source-admission boundaries;
- concept-type, relationship-type, claim-type, domain, dimension, quality-attribute, lifecycle, and identifier registries;
- the knowledge, claim, relationship, source, and shared schemas;
- `validation/policies.yaml` and the Markdown, evidence, claim-derivation, relationship, lifecycle, ID, and registry-consistency validators;
- generated integrity reports and M3 validation reports;
- repository-level and layered `AGENTS.md` instructions.

The source audit independently inspected the public material behind AKS-000001 through AKS-000022. Where a public landing page did not expose the asserted normative detail, the relevant claim is reported as unverified rather than accepted by assumption.

## Commands Executed

The required baseline was run before creating this report:

| Command | Actual result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed; lockfile current; pnpm 10.23.0. pnpm reported the existing ignored-build-script warning for `esbuild`. |
| `pnpm format:check` | Passed. |
| `pnpm validate` | Passed. Typecheck and schema, vocabulary, ID, source, claim, relationship, lifecycle, Markdown, and link validation completed with 0 errors and 0 warnings. |
| `pnpm test` | Passed: 16 test files, 56 tests. |
| `pnpm test:coverage` | Passed: 16 files, 56 tests; 95.87% statements, 82.48% branches, 99.07% functions, and 96.94% lines. |
| `pnpm report:check` | Passed: 12 of 12 integrity reports current. |
| `git status --short` | Clean before the audit report was created. |

Mutation testing was not rerun. The semantic weaknesses found are content, ontology, relationship, and policy-design issues rather than an unexplained mutation-testing gap.

Green automated checks establish structural validity only. They do not alter the semantic verdict.

## Findings Summary

### By severity

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 10 |
| Medium | 4 |
| Low | 1 |
| Observation | 1 |
| **Total** | **16** |

### By primary category

| Category | Count |
|---|---:|
| Source fidelity | 4 |
| Taxonomy | 3 |
| Relationship semantics | 2 |
| AI/structured usability | 2 |
| Quality-attribute impact | 1 |
| Security | 1 |
| Validation policy | 1 |
| Cross-unit terminology | 1 |
| Editorial clarity | 1 |

## Detailed Findings

### M3-AUD-001

- **Finding ID:** M3-AUD-001
- **Severity:** High
- **Category:** Source fidelity
- **Affected record or file:** `knowledge/quality/quality-attribute-scenario.md`
- **Affected claim or relationship ID:** AKL-000006
- **Evidence:** The admitted public SEI collection page explains the purpose of general quality-attribute scenarios but does not expose or enumerate the six claimed elements. Searches of the inspectable page find neither `stimulus` nor a six-part structure. See [SEI, Reasoning About Software Quality Attributes](https://www.sei.cmu.edu/library/reasoning-about-software-quality-attributes/).
- **Problem:** AKL-000006 is classified as a high-confidence normalized source claim even though AKS-000004 does not contain the normalized structure.
- **Impact:** A foundational schema-like architecture concept appears directly verified when it is not. Retrieval would present an evidence claim stronger than the admitted source permits.
- **Required remediation:** Admit an inspectable primary SEI source that explicitly defines all six parts and cite its exact section, or reclassify the statement as unverified synthesis and reduce confidence until that source is admitted.
- **M4 blocking:** yes

### M3-AUD-002

- **Finding ID:** M3-AUD-002
- **Severity:** High
- **Category:** Source fidelity
- **Affected record or file:** `knowledge/distributed-systems/idempotency.md`
- **Affected claim or relationship ID:** AKL-000011, AKL-000025, AKR-000005
- **Evidence:** [RFC 9110 section 9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) defines idempotency for the intended server effect of multiple identical HTTP requests with a request method. AKS-000012 discusses duplicate effects of retried business-data commands, but it does not provide a protocol-neutral definition covering message redelivery, replay, concurrency, retention windows, and external effects.
- **Problem:** The current umbrella statement combines HTTP method semantics with a broad implementation property, while the concept is typed only as a tactic. The note acknowledges the boundary, but the claim and graph object do not preserve it.
- **Impact:** A future graph can incorrectly answer that HTTP idempotency, message deduplication, effect idempotency, and an idempotency-key tactic are one intrinsic property.
- **Required remediation:** Split or explicitly model HTTP method idempotency, operation/effect idempotency, and implementation tactics under a governed umbrella. Add a protocol-neutral primary source for message/operation semantics. Rebind AKL-000025 and AKR-000005 to the precise duplicate-effect-control concept or role.
- **M4 blocking:** yes

### M3-AUD-003

- **Finding ID:** M3-AUD-003
- **Severity:** High
- **Category:** Source fidelity
- **Affected record or file:** `knowledge/quality/availability.md`, `knowledge/quality/reliability.md`, `sources/registry.yaml`
- **Affected claim or relationship ID:** AKL-000004, AKL-000005, AKL-000040, AKR-000020
- **Evidence:** The public [ISO/IEC 25010:2023 landing page](https://www.iso.org/standard/78176.html) exposes only the model abstract, not the detailed definitions or hierarchy. The SEI collection provides scenario examples, and the [Google SRE SLO chapter](https://sre.google/sre-book/service-level-objectives/) defines operational availability and separately discusses correctness. Those public sources do not jointly establish the exact high-confidence reliability definition or a causal `reliability influences availability` edge.
- **Problem:** Licensed material that was not independently inspectable carries material definitional weight. AKR-000020 also risks representing an ISO taxonomy relation as a causal relation without declaring which quality model governs the corpus.
- **Impact:** The quality subtree can encode an unverified definition and confuse classification with causality.
- **Required remediation:** Review and record an authorized copy of the normative text without reproducing it, or replace it with inspectable sources. Explicitly choose whether availability is modeled as an ISO reliability subcharacteristic, as a separate operational quality, or in both contextual roles. Then use a taxonomy predicate and/or separately evidenced causal claim as appropriate.
- **M4 blocking:** yes

### M3-AUD-004

- **Finding ID:** M3-AUD-004
- **Severity:** High
- **Category:** Quality-attribute impact
- **Affected record or file:** `knowledge/observability/observability.md`
- **Affected claim or relationship ID:** AKL-000035, AKR-000015
- **Evidence:** [OpenTelemetry's observability primer](https://opentelemetry.io/docs/concepts/observability-primer/) defines understanding and investigation from outputs. The Google SLO chapter covers measurement and objectives. Neither establishes that observability causes a measurable reliability improvement or reduced detection/diagnosis time.
- **Problem:** A plausible operating hypothesis is recorded as a sourced `improves` relationship. Its conditions make it less absolute but do not provide causal evidence.
- **Impact:** Graph traversal can turn architecture folklore into a quality guarantee.
- **Required remediation:** Reclassify the statement as an explicit recommendation or inference, reduce confidence, define measurable intermediary outcomes, and add empirical or operational evidence before retaining an `improves` edge.
- **M4 blocking:** yes

### M3-AUD-005

- **Finding ID:** M3-AUD-005
- **Severity:** High
- **Category:** Taxonomy
- **Affected record or file:** `knowledge/distributed-systems/eventual-consistency.md`, `ontology/concept-types.yaml`
- **Affected claim or relationship ID:** AKC-000016, AKL-000016, AKR-000011, AKR-000012, AKR-000020 indirectly
- **Evidence:** The admitted foundational article describes eventual consistency explicitly as a form of weak consistency and a consistency model. See [Eventually Consistent—Revisited](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html).
- **Problem:** AKC-000016 is typed as `data-pattern`, whose registry definition requires a reusable problem-context-solution arrangement. Eventual consistency is principally a consistency model or observable guarantee; it can be a consequence of patterns but is not itself necessarily a pattern.
- **Impact:** Pattern retrieval and relationship constraints will misclassify a state/consistency guarantee as a solution form.
- **Required remediation:** Add an assignable `consistency-model` or suitable system-property type, migrate AKC-000016 while retaining its immutable ID, and document contextual roles such as consequence or design choice without using them as the primary type.
- **M4 blocking:** yes

### M3-AUD-006

- **Finding ID:** M3-AUD-006
- **Severity:** High
- **Category:** Validation policy
- **Affected record or file:** `validation/policies.yaml`, `src/markdown-validator.ts`, all four `knowledge/supporting/*.md` records
- **Affected claim or relationship ID:** AKC-000021 through AKC-000024
- **Evidence:** `failure-mode` is included in `markdown.failure_sensitive_types`. The validator requires every failure-sensitive concept to have a non-empty `failure_modes` array. The four failure modes therefore point arbitrarily to other failure modes: 21→22, 22→21, 23→22, and 24→21.
- **Problem:** The policy creates a recursive structural requirement with no semantic basis. The current links are content defects caused by a validation-policy defect; the policy also exposes an ontology-contract weakness because a failure mode cannot express terminal analysis without another failure mode.
- **Impact:** Graph generation would encode invented failure chains and cycles even though the relationship validator reports zero typed relationship cycles.
- **Required remediation:** Exclude `failure-mode` from the recursive non-empty rule or create a distinct analysis-completeness rule. Remove arbitrary `failure_modes` references from the four supporting nodes, add regression tests, and preserve legitimate failure-to-failure relations only when independently evidenced.
- **M4 blocking:** yes

### M3-AUD-007

- **Finding ID:** M3-AUD-007
- **Severity:** High
- **Category:** Security
- **Affected record or file:** `knowledge/security/oauth-2x.md`, `knowledge/security/openid-connect.md`
- **Affected claim or relationship ID:** AKL-000017, AKL-000018, AKL-000033, AKL-000034, AKL-000043, AKL-000047
- **Evidence:** The corpus correctly distinguishes authorization from authentication and access tokens from ID Tokens. However, [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) requires more precise current guidance: public-client PKCE requirements, refresh-token replay protection, sender-constrained tokens where appropriate, explicit discouraged grants, and audience restrictions. OIDC Core requires ID Tokens to be JWTs, while OAuth access-token format is not universally JWT.
- **Problem:** The units omit or understate public versus confidential clients, mandatory public-client PKCE, refresh-token rotation/sender constraint, sender-constrained access tokens, user-agent role, token-format optionality, and the discouraged status of implicit and resource-owner-password flows. “PKCE where applicable” is too ambiguous for current guidance.
- **Impact:** A retrieved OAuth/OIDC unit can be technically correct at a high level yet omit controls needed for a safe implementation.
- **Required remediation:** Apply RFC 9700 requirements explicitly and contextually; distinguish actors and client types; state access-token versus ID-token format semantics; cover refresh-token protection, replay, sender constraint, and discouraged grants; keep deployment policy separate from protocol requirements.
- **M4 blocking:** yes

### M3-AUD-008

- **Finding ID:** M3-AUD-008
- **Severity:** High
- **Category:** Taxonomy
- **Affected record or file:** `knowledge/security/oauth-2x.md`
- **Affected claim or relationship ID:** AKC-000017 and its claims/relationships
- **Evidence:** AKC-000017 is titled `OAuth 2.x` but its evidence consists of OAuth 2.0 RFC 6749 and OAuth 2.0 Security BCP RFC 9700. As of the audit date, OAuth 2.1 remains an active Internet-Draft, not a final RFC; see the [IETF OAuth 2.1 draft record](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/).
- **Problem:** One protocol node implies a family/version scope that the admitted evidence does not define. It also combines a base protocol with a security profile without representing their versioned relationship.
- **Impact:** Future retrieval can treat work-in-progress OAuth 2.1 behavior as already part of the sourced node or obscure which requirements come from RFC 6749 versus RFC 9700.
- **Required remediation:** Model a non-versioned umbrella only if umbrella semantics are supported, plus a versioned OAuth 2.0 protocol node and a related security-profile/BCP node. Represent OAuth 2.1 separately as work in progress only if project scope needs it; do not present it as normative.
- **M4 blocking:** yes

### M3-AUD-009

- **Finding ID:** M3-AUD-009
- **Severity:** High
- **Category:** Relationship semantics
- **Affected record or file:** `relationships/AKR-000023.yaml`, `relationships/AKR-000024.yaml`
- **Affected claim or relationship ID:** AKL-000047, AKL-000048, AKR-000023, AKR-000024
- **Evidence:** Both edges use `introduces`. Their conditions describe failed validation, delivery, replay, conflict handling, or repair—not inherent protocol/architecture behavior.
- **Problem:** OIDC does not itself introduce token-role confusion; a consumer's misuse or misconfiguration does. EDA does not itself introduce unreconciled divergence; failed or absent reconciliation converts bounded temporary divergence into that failure.
- **Impact:** The proposed graph would attribute security and data failures to the protocol/style rather than to the failing control or condition.
- **Required remediation:** Reify the misuse/control-failure subject or use a predicate whose semantics preserve conditional contribution. Keep the proposed claims as scoped risk statements only after direct evidence and threat/convergence conditions are attached.
- **M4 blocking:** yes

### M3-AUD-010

- **Finding ID:** M3-AUD-010
- **Severity:** High
- **Category:** AI/structured usability
- **Affected record or file:** all 24 knowledge Markdown records
- **Affected claim or relationship ID:** all concept records
- **Evidence:** Every unit contains meaningful prose for alternatives, examples, counterexamples, risks, assumptions, and constraints, but every corresponding structured array is empty. Important qualifiers and rejection criteria exist only in prose. The prose sections therefore pass Markdown completeness while machine-readable fields assert no such data.
- **Problem:** The structured record and human-readable body are semantically inconsistent.
- **Impact:** M4 graph/RAG consumers can retrieve a concept without its rejection criteria, risk, example, or alternative, producing one-sided recommendations.
- **Required remediation:** Populate structured fields from reviewed content, define which Markdown sections are authoritative projections of metadata, validate consistency between the two representations, and ensure critical qualifiers travel with independently retrieved claims.
- **M4 blocking:** yes

### M3-AUD-011

- **Finding ID:** M3-AUD-011
- **Severity:** Medium
- **Category:** Source fidelity
- **Affected record or file:** multiple claims and knowledge units
- **Affected claim or relationship ID:** AKL-000001, 000002, 000003, 000010, 000012, 000020, 000021, 000026, 000027, 000030, 000033, 000036, 000037, 000038, 000039
- **Evidence:** The claim matrix below records each scope mismatch. Common patterns are transfer from aerospace to general software, one-vendor guidance normalized as universal truth, indirect synthesis classified as direct normalization, and confidence higher than the accessible evidence warrants.
- **Problem:** Claim typing and confidence do not consistently reflect source proximity.
- **Impact:** Ranking by confidence or claim type will over-prioritize some inferential statements.
- **Required remediation:** Apply the individual matrix dispositions; preserve transfer conditions, use `synthesis` or recommendation where appropriate, and lower confidence until direct evidence is attached.
- **M4 blocking:** no, provided all High claim issues are fixed and these records are excluded or visibly qualified during M4 entry

### M3-AUD-012

- **Finding ID:** M3-AUD-012
- **Severity:** Medium
- **Category:** Relationship semantics
- **Affected record or file:** relationship registry records
- **Affected claim or relationship ID:** AKR-000001, 000006, 000007, 000009, 000013, 000017, 000018, 000019
- **Evidence:** These edges are respectively inferential, weakly evidenced as quality impacts, too broad in direction, redundant, or tautological. Full dispositions appear in the relationship assessment.
- **Problem:** Conditions reduce overstatement, but several predicates still express more than their evidence or add little retrieval value.
- **Impact:** Graph traversal will return plausible but weakly discriminating paths.
- **Required remediation:** Reclassify inferential edges, narrow the subject/object, remove redundant compatibility, and attach direct cross-concept evidence.
- **M4 blocking:** no, if the affected edges are withheld from production traversal until corrected

### M3-AUD-013

- **Finding ID:** M3-AUD-013
- **Severity:** Medium
- **Category:** AI/structured usability
- **Affected record or file:** all 24 relationship records
- **Affected claim or relationship ID:** AKR-000001 through AKR-000024
- **Evidence:** Relationship conditions contain useful free text, but every `conditions[].concept_ids` array is empty.
- **Problem:** Conditions are attached to edges but cannot be traversed, normalized, or reused as context nodes.
- **Impact:** M4 can preserve text but cannot reliably answer which explicit assumption, constraint, or context condition qualifies an edge.
- **Required remediation:** Decide which conditions deserve first-class context-condition/constraint/assumption concepts, link those IDs, and keep truly edge-local conditions as text.
- **M4 blocking:** no

### M3-AUD-014

- **Finding ID:** M3-AUD-014
- **Severity:** Medium
- **Category:** Cross-unit terminology
- **Affected record or file:** reliability, availability, retry, circuit-breaker, microservices, and eventual-consistency units
- **Affected claim or relationship ID:** AKL-000004, 000005, 000013, 000016, 000026, 000027, 000036, 000040
- **Evidence:** Availability and reliability are first-class and carefully differentiated, while resilience, fault tolerance, and recoverability are used as adjacent terms without governed definitions or explicit contextual roles.
- **Problem:** No direct contradiction was found, but neighboring dependability terms can drift when chunks are retrieved independently.
- **Impact:** A future answer may treat resilience, reliability, recoverability, and fault tolerance as synonyms.
- **Required remediation:** Add governed definitions or explicit terminology notes before those terms become graph predicates or major retrieval keys.
- **M4 blocking:** no

### M3-AUD-015

- **Finding ID:** M3-AUD-015
- **Severity:** Low
- **Category:** Editorial clarity
- **Affected record or file:** all knowledge units
- **Affected claim or relationship ID:** none
- **Evidence:** `Related Concepts` repeatedly uses boilerplate such as “AKC-… are governed related concepts. Typed edges are recorded separately.”
- **Problem:** The wording is grammatically awkward and adds little standalone explanation.
- **Impact:** Human readers must open relationship records to learn why a concept is related.
- **Required remediation:** Replace boilerplate with one concise, concept-specific explanation while retaining typed edges as the machine authority.
- **M4 blocking:** no

### M3-AUD-016

- **Finding ID:** M3-AUD-016
- **Severity:** Observation
- **Category:** Taxonomy
- **Affected record or file:** `knowledge/application-architecture/modular-monolith.md`, `knowledge/observability/observability.md`
- **Affected claim or relationship ID:** AKC-000007, AKC-000019
- **Evidence:** The current prose treats modular monolith as a system-level organizing style and observability as an assessable system capability.
- **Problem:** Both concepts legitimately play several contextual roles; a single primary type cannot express every role.
- **Impact:** No present defect if primary type and contextual roles remain explicit.
- **Required remediation:** Retain `architectural-style` for Modular Monolith, with decomposition and deployment facets modeled separately. Retain `quality-attribute` for Observability only if measurable scenarios are required; otherwise consider a system-property/operational-capability umbrella in a later migration.
- **M4 blocking:** no

## Source Fidelity Problem Detail

The following table provides the required source-boundary fields for every sourced claim that is not fully supported as currently classified.

| Claim ID | Knowledge unit | Source ID | Severity | Problem | Source-supported scope | Current overreach or mismatch | Required correction |
|---|---|---|---|---|---|---|---|
| AKL-000001 | First-Principles Thinking | AKS-000001 | Medium | Modern software reasoning is inferred from a historical/philosophical entry. | Aristotle's foundational, non-demonstrated propositions within a science. | `normalized-source-claim` suggests a directly sourced general method. | Reclassify as synthesis or admit a modern reasoning-method source. |
| AKL-000002 | Systems Thinking | AKS-000002 | Medium | The exact bundled definition is not stated and the phrase “systems thinking” is absent from the inspectable handbook text. | Lifecycle systems engineering, interacting elements, stakeholders, feedback-related reasoning, and boundaries. | Aerospace handbook content is normalized into universal software guidance at High confidence. | Use synthesis, retain the aerospace transfer boundary, and reduce confidence or add a direct systems-thinking source. |
| AKL-000003 | Constraint | AKS-000002, AKS-000022 | Medium | NASA supports constraint as a condition to be met; the public ISO page does not expose assumption/preference distinctions. | System constraints and architecture-description context. | The full three-way distinction is treated as sourced synthesis despite an uninspectable contribution. | Add an inspectable terminology source or narrow the statement to the supported distinction. |
| AKL-000004 | Availability | AKS-000003, 000004, 000005 | High | ISO detail is unverified; Google supports operational usability and measurement. | Availability as measured service usability plus quality-scenario framing. | Exact definitional synthesis and High confidence rely partly on inaccessible licensed text. | Review authorized normative text or narrow to the public operational definition and lower confidence. |
| AKL-000005 | Reliability | AKS-000003, 000004, 000005 | High | None of the public pages establishes the exact composite definition at the claimed confidence. | Failure response scenarios, correctness indicators, and a quality-model abstract. | Exact reliability semantics and separation from availability are treated as fully verified. | Add inspectable normative/primary support or mark unverified synthesis. |
| AKL-000006 | Quality Attribute Scenario | AKS-000004 | High | The six elements are absent from the admitted page. | Purpose of general and concrete quality-attribute scenarios. | Six-part normalized claim. | Admit and cite the direct SEI source or mark unverified. |
| AKL-000010 | Event-Driven Architecture | AKS-000010 | Medium | One vendor's architecture guidance is the only source for a vendor-neutral normalized definition. | Producers, channels, consumers, asynchronous response, and decoupling. | “Event facts” and universal normalization exceed the source's status as secondary vendor guidance. | Keep the content as synthesis/qualified normalization or add an independent primary source. |
| AKL-000011 | Idempotency | AKS-000011, 000012 | High | HTTP method semantics do not define all operation/message idempotency. | HTTP intended method effect; retry duplicate-risk guidance. | General request/effect semantics across distributed operations. | Split roles and add protocol-neutral direct evidence. |
| AKL-000012 | Retry | AKS-000012 | Medium | The source supports transient, bounded retry guidance, but “only” and the complete end-to-end formulation are prescriptive synthesis. | Retry of transient faults with bounded count/delay and workload trade-offs. | Classified as direct normalized fact at High confidence. | Reclassify as recommendation/synthesis and retain exceptions and budgets. |
| AKL-000020 | Architecture Decision Record | AKS-000021, 000022 | Medium | Nygard directly supports the lightweight format; the public ISO page does not prescribe ADRs. | Significant decision, context, status, decision, and consequences. | The ISO source can appear to standardize the ADR form; “rationale” is interpretive. | Treat Nygard as primary, ISO as contextual only, and qualify format variants. |
| AKL-000021 | First-Principles + Systems Thinking | AKS-000001, 000002 | Medium | Neither source compares or combines the methods. | Each method's separate basis. | Compatibility is repository inference labeled sourced synthesis. | Classify as inference/recommendation or admit comparative evidence. |
| AKL-000025 | Retry Requires Idempotency | AKS-000011, 000012 | High | The retry source supports duplicate control; RFC 9110 supports only HTTP method semantics. | Safe repetition for uncertain state-changing commands. | The graph object `Idempotency` is too broad and typed as a tactic. | Bind to precise duplicate-effect control after taxonomy split. |
| AKL-000026 | Retry Improves Availability | AKS-000012 | Medium | The source supports resilience/stability for transient faults but does not directly establish a measurable availability delta. | Conditional transient-fault mitigation. | Quality improvement is inferred. | Retain as recommendation, specify measure, and reduce evidentiary strength. |
| AKL-000027 | Circuit Breaker Improves Availability | AKS-000013 | Medium | The source directly supports stability, capacity preservation, and response time, not a general availability increase. | Fail-fast behavior and recovery protection. | Caller availability effect is inferred. | Retain as recommendation with an availability measure or use the directly supported quality. |
| AKL-000030 | Outbox Improves Reliability | AKS-000014 | Medium | The source supports closing a specific dual-write gap while explicitly retaining duplicate/order risks. | Durable message intent coupled to local state. | High confidence can be read as broad end-to-end reliability. | Narrow the quality measure and reduce confidence to reflect remaining relay/consumer failure modes. |
| AKL-000033 | OAuth/OIDC Compatibility | AKS-000017, 000019 | Medium | OIDC's dependency on OAuth is direct; a separate compatibility claim adds little and can obscure extension/dependency semantics. | OIDC uses OAuth mechanisms while adding authentication semantics. | Redundant `compatible-with` assertion. | Prefer the dependency/extension relation; remove or lower the informational edge. |
| AKL-000035 | Observability Improves Reliability | AKS-000005, 000020 | High | Sources do not establish the causal quality impact. | Observability definition and SLO/indicator practice. | Improvement relationship presented as sourced. | Mark inference/recommendation and add empirical evidence and measures. |
| AKL-000036 | Microservices Degrade Reliability | AKS-000007, 000008 | Medium | Sources document distributed complexity and design-for-failure needs, not a universal measured degradation. | Conditional operational risks. | A quality-degradation edge is inferred. | Keep conditional, lower evidentiary strength, and define the reliability measure. |
| AKL-000037 | QAS Documented by ADR | AKS-000004, 000021, 000022 | Medium | No source explicitly connects QAS to the ADR format. | QAS as a decision driver; ADR as a decision record. | Cross-concept practice recommendation is represented as sourced synthesis. | Reclassify as recommendation/inference or admit direct practice evidence. |
| AKL-000038 | Constraint Constrains Microservices | AKS-000002, 000007, 000008 | Medium | Sources support each endpoint but not the enumerated cross-concept rule. | Constraints and microservice trade-offs separately. | Tautological generic relationship with weak discriminating value. | Replace with specific constraint concepts/conditions and direct evidence. |
| AKL-000039 | Systems Thinking Influences ADR | AKS-000002, 000021, 000022 | Medium | Sources do not explicitly establish the cross-method recommendation. | Systems reasoning and ADR recording separately. | Recommendation appears sourced by juxtaposition. | Keep as recommendation/inference and lower confidence or add direct evidence. |
| AKL-000040 | Reliability Influences Availability | AKS-000003, 000004, 000005 | High | Public sources do not establish this exact causal edge and ISO taxonomy detail is unavailable. | Separate service usability, correctness, and failure-response concerns. | Taxonomy and causal effect are conflated at High confidence. | Resolve the quality model and separately evidence taxonomy and causal relations. |

## Source Fidelity Matrix

Disposition legend:

- **Supported:** admitted public evidence supports the claim within its stated conditions and current classification.
- **Qualified:** core statement is plausible and partly supported, but classification, confidence, or scope needs correction.
- **Blocked:** High source-fidelity defect; do not use for M4 traversal.

| Claim | Sources | Disposition | Audit conclusion |
|---|---|---|---|
| AKL-000001 | 001 | Qualified | Historical scope supports foundations, not a normalized modern software method. |
| AKL-000002 | 002 | Qualified | Aerospace systems-engineering transfer and exact bundled definition need qualification. |
| AKL-000003 | 002, 022 | Qualified | Constraint is supported; assumption/preference distinction is not independently verified. |
| AKL-000004 | 003, 004, 005 | Blocked | Operational availability is supported, but the exact high-confidence synthesis relies on inaccessible ISO detail. |
| AKL-000005 | 003, 004, 005 | Blocked | Exact reliability definition and its separation/hierarchy are not established by inspectable sources. |
| AKL-000006 | 004 | Blocked | Six-part QAS structure is absent from the admitted page. |
| AKL-000007 | 006, 007 | Supported | GitLab case plus monolith/microservice contrast supports the qualified synthesis. |
| AKL-000008 | 007, 008 | Supported | Both sources support autonomous, capability-aligned, independently deployable services. |
| AKL-000009 | 009 | Supported | Original description supports ports, adapters, application boundary, and isolation. |
| AKL-000010 | 010 | Qualified | Core definition is supported; normalized vendor-neutral status is stronger than a single secondary vendor source. |
| AKL-000011 | 011, 012 | Blocked | HTTP semantics are generalized into broader effect/message semantics. |
| AKL-000012 | 012 | Qualified | Mechanism is supported; direct-normalization type and “only” formulation are too strong. |
| AKL-000013 | 013 | Supported | State machine and recovery probe behavior are directly supported. |
| AKL-000014 | 014 | Supported | Local atomic write plus asynchronous relay is directly supported. |
| AKL-000015 | 015 | Supported | Local transactions, compensation, retry/forward completion, and intervention are supported. |
| AKL-000016 | 016, 010, 015 | Supported | Divergence and convergence assumptions are supported; concept type remains blocked separately. |
| AKL-000017 | 017, 018 | Supported | Authorization-not-authentication boundary is correct and uses current BCP context. |
| AKL-000018 | 019 | Supported | OIDC identity layer and authentication semantics are directly supported. |
| AKL-000019 | 020 | Supported | The definition does not mandate OpenTelemetry and is within the source boundary. |
| AKL-000020 | 021, 022 | Qualified | Nygard supports ADRs; ISO is contextual, not prescriptive of the format. |
| AKL-000021 | 001, 002 | Qualified | Combination is a reasonable repository inference, not directly sourced comparison. |
| AKL-000022 | 006, 007, 008 | Supported | Alternative deployment/decomposition decision is adequately conditioned. |
| AKL-000023 | 006, 009 | Supported | GitLab explicitly combines modular monolith and hexagonal boundaries. |
| AKL-000024 | 007, 008, 010 | Supported | Coexistence under governed async contracts is supported. |
| AKL-000025 | 011, 012 | Blocked | Duplicate-effect need is supported, but the idempotency target is semantically overbroad. |
| AKL-000026 | 012 | Qualified | Conditional recommendation is reasonable; measurable availability effect is not direct. |
| AKL-000027 | 013 | Qualified | Capacity/stability effect is direct; caller-availability improvement is inferred. |
| AKL-000028 | 012, 013 | Supported | Source explicitly permits coordinated retry and circuit breaker use. |
| AKL-000029 | 010, 014 | Supported | Reliable publication for the stated local-database context is supported. |
| AKL-000030 | 014 | Qualified | Specific dual-write reliability effect is supported; confidence/scope should be narrower. |
| AKL-000031 | 015, 016 | Supported | Intermediate states and eventual consistent outcome are supported. |
| AKL-000032 | 010, 016 | Supported | Async independent state condition preserves the source boundary. |
| AKL-000033 | 017, 019 | Qualified | True but redundant and weaker than the direct OIDC-depends-on-OAuth relation. |
| AKL-000034 | 019 | Supported | Directly stated by OIDC Core. |
| AKL-000035 | 005, 020 | Blocked | Causal reliability improvement is not established. |
| AKL-000036 | 007, 008 | Qualified | Conditional risk is supported; quality degradation is inferential. |
| AKL-000037 | 004, 021, 022 | Qualified | Cross-practice link is not stated by the sources. |
| AKL-000038 | 002, 007, 008 | Qualified | Plausible but tautological; source juxtaposition does not establish the edge. |
| AKL-000039 | 002, 021, 022 | Qualified | Reasonable recommendation, not a directly sourced relationship. |
| AKL-000040 | 003, 004, 005 | Blocked | Unverified taxonomy plus unsupported causal edge. |

Result: **18 Supported, 15 Qualified, 7 Blocked**. The 7 Blocked claims are AKL-000004, 000005, 000006, 000011, 000025, 000035, and 000040.

## Proposed Records Matrix

No proposed record is promoted by this audit.

### Proposed claims

| Record | Disposition | Evidence or qualification required before sourcing |
|---|---|---|
| AKL-000041 | Valid inference awaiting evidence | Add a direct cascading-failure/retry-storm source; define capacity, feedback, and queue conditions. |
| AKL-000042 | Valid repository synthesis; coined label | Add architecture-erosion/modularity evidence or retain as an explicitly project-defined inference; separate structural coupling from release/ownership coupling. |
| AKL-000043 | Valid security synthesis | Cite exact OIDC token-substitution/audience validation and RFC 9700 mix-up/token-injection sections; keep issuer, audience, client, and role scopes distinct. |
| AKL-000044 | Valid inference awaiting evidence | Add direct convergence/repair evidence and define the accepted divergence bound and authoritative comparison. |
| AKL-000045 | Sourceable conditional risk | AKS-000012 now directly discusses aggregate retry overload; attach the exact section and preferably corroborate with a primary cascading-failure source. |
| AKL-000046 | Valid recommendation | Evidence must cover continuously enforced module API, dependency, and data-ownership controls; GitLab provides a case, not universal proof. |
| AKL-000047 | Valid risk statement but wrong graph actor | Keep as an integration-misuse claim, attach exact OIDC/RFC 9700 evidence, and do not state that OIDC intrinsically introduces the failure. |
| AKL-000048 | Valid conditional inference but wrong graph actor | Reframe around delivery/reconciliation failure; attach evidence for replay, repair, and convergence-bound failure. |

### Proposed relationships

| Record | Disposition | What must happen before it can become sourced |
|---|---|---|
| AKR-000021 | Semantically valid with conditions | Attach exact retry-storm/cascading-failure evidence and retain persistence/saturation conditions. |
| AKR-000022 | Semantically valid recommendation edge | Attach evidence for continuously enforced module boundaries and specify which erosion mechanism is mitigated. |
| AKR-000023 | Remove or remodel | OIDC is not the causal actor; make validation/misuse failure the subject or use a more accurate claim-specific relation. |
| AKR-000024 | Remove or remodel | EDA can introduce temporary inconsistency, but unreconciled divergence arises from failed delivery/conflict/replay/repair mechanisms. |

## Taxonomy Tension Assessment

| Tension | Current representation | Semantic risk | Viable alternatives | Recommended direction | Migration impact | Blocks M4 |
|---|---|---|---|---|---|---|
| Idempotency | Primary `tactic` | Collapses HTTP semantic property, message/operation outcome property, and implementation mechanisms. | `semantic-property`; `operational-property`; separate tactic nodes; umbrella with contextual roles. | Create a governed umbrella or semantic-property node, retain contextual HTTP semantics, and create separate implementation tactic concepts where needed. Rebind retry/outbox relations to the precise role. | Concept-type registry/schema migration; AKC-000011 retains ID; claims and relationships require remapping or split records with migration history. | Yes |
| Eventual Consistency | Primary `data-pattern` | Treats a consistency guarantee/model as a reusable solution pattern. | `consistency-model`; distributed-system property; consequence role; umbrella. | Add `consistency-model` as assignable primary. Express consequence-of-architecture through relationships, not primary type. | Registry/schema migration; AKC-000016 retains ID; relationship semantics reviewed. | Yes |
| Modular Monolith | Primary `architectural-style` | A single type underrepresents decomposition and deployment facets, but current type is defensible. | Decomposition model; deployment topology; composite classification; style plus facets. | Retain `architectural-style`; model logical decomposition and single deployment as independent dimensions/conditions. Do not add `pattern` merely as a synonym. | Non-breaking metadata enrichment; no ID or primary-type migration required. | No |
| Observability | Primary `quality-attribute` | Can conflate system property, operational capability, and engineering discipline; current causal edge worsens the ambiguity. | System property; operational capability; engineering discipline; measurable umbrella with subordinate practices. | Retain `quality-attribute` only with explicit scenarios/measures; later add role/property vocabulary if needed. Separate telemetry practice/tooling and operational response from the property. | Likely additive ontology migration; AKC-000019 can retain ID. | No for type alone; Yes for AKR-000015 evidence |
| OAuth 2.x | One `protocol` node titled as a version family | Conflates OAuth 2.0, Security BCP, extensions, and work-in-progress OAuth 2.1. | Umbrella plus versioned protocols; OAuth 2.0 node plus BCP/profile nodes; separate extension specifications. | Use a version-neutral umbrella only if justified, a versioned OAuth 2.0 protocol node, and explicit BCP/extension nodes. Treat OAuth 2.1 as work in progress until final. | Split/migration record required; preserve AKC-000017 through an explicit role decision; rebind OIDC and token-confusion records. | Yes |

## OAuth/OIDC Security Review

### Control coverage

| Required distinction/control | Result | Audit note |
|---|---|---|
| OAuth authorization vs authentication | Pass | Explicit and correct. |
| OIDC identity vs OAuth access delegation | Pass | Explicit and correct. |
| Authorization server, resource server, client, resource owner, user agent | Partial | Four OAuth roles are present; user-agent/browser role is not fully modeled as an actor. |
| Access tokens vs ID Tokens | Pass | The counterexamples correctly reject ID Tokens as API access credentials. |
| Token audience/intended recipient | Pass | Present in runtime, testing, and failure guidance. |
| Authorization code flow and PKCE | Partial/High | Authorization code is preferred, but “PKCE where applicable” is weaker than current public-client requirements. |
| Confidential vs public clients | Missing/High | Client types are mentioned but not defined or connected to authentication, PKCE, or refresh-token rules. |
| Redirect URI validation | Pass | Exact matching is stated. |
| Client authentication | Partial | Mentioned as a threat/validation concern, not explained by client type. |
| Bearer-token risk | Partial | Bearer risk is named; practical replay and sender-constraint treatment is incomplete. |
| Refresh-token handling | Missing/High | Rotation, binding, expiry, replay detection, and client-type conditions are absent. |
| Token replay | Partial | Threat and tests are named; access/refresh-token mitigations are incomplete. |
| Sender-constrained tokens | Missing/High | DPoP/mTLS need not be universal defaults, but their role under RFC 9700 should be visible. |
| JWT format semantics | Missing/High | ID Tokens are JWTs; OAuth access tokens need not be JWTs. This distinction is not explicit. |
| Protocol framework vs deployment policy | Mostly pass | Scopes are correctly separated from local authorization, but the protocol/version node needs splitting. |
| Discouraged/outdated grants | Partial | The corpus does not recommend implicit or password grants, but it does not explicitly record current discouragement. |

### Security conclusion

The high-level semantic boundary is sound, and no current sentence directly recommends an unsafe deprecated flow. The security units are nevertheless incomplete for standalone use. A retrieval system could return “use authorization code, PKCE where applicable” without the client-type and replay protections required to make that advice safe. RFC 9700 is admitted but not applied comprehensively. This is a High, M4-blocking completeness defect rather than a Critical false-protocol statement.

## Relationship Quality Assessment

### All relationship dispositions

| Relationship | Audit disposition | Reason |
|---|---|---|
| AKR-000001 | Weak/inferential | Compatibility of two reasoning methods is plausible but not directly compared by sources. |
| AKR-000002 | Acceptable | Alternative deployment/decomposition decision is well conditioned. |
| AKR-000003 | Acceptable | GitLab directly demonstrates the combination. |
| AKR-000004 | Acceptable | Coexistence is supported and not asserted as required. |
| AKR-000005 | Semantically conditioned; blocked by target taxonomy | The duplicate-effect requirement is sound, but `Idempotency` is too broad. |
| AKR-000006 | Weak quality impact | Availability improvement is inferred, though conditions are good. |
| AKR-000007 | Weak quality impact | Stability/capacity effect is direct; caller availability requires a measure. |
| AKR-000008 | Acceptable | Source explicitly supports coordinated use. |
| AKR-000009 | Direction/scope too broad | Outbox enables a reliable publication mechanism, not EDA as a whole. Prefer an event-publication concept or an `implemented-by` relation from the relevant EDA behavior. |
| AKR-000010 | Acceptable with narrowed measure | Specific dual-write reliability mechanism is supported; not end-to-end reliability. |
| AKR-000011 | Acceptable | Saga completion/recovery depends on managed convergence under the stated condition. |
| AKR-000012 | Acceptable | The independent asynchronous-state condition prevents an intrinsic universal reading. |
| AKR-000013 | Redundant/low information | OIDC dependency already carries the meaningful relation; compatibility adds little. |
| AKR-000014 | Acceptable | OIDC directly depends on OAuth protocol mechanisms. |
| AKR-000015 | Unsupported quality impact | Plausible, but no causal evidence supports `improves`. |
| AKR-000016 | Qualified inference | Sources support operational risk; measurable reliability degradation is not direct. |
| AKR-000017 | Unsupported cross-practice edge | Neither source explicitly connects QAS records to ADRs. |
| AKR-000018 | Tautological/low information | A generic Constraint constraining Microservices does not identify a useful specific constraint. |
| AKR-000019 | Unsupported cross-method edge | Reasonable practice recommendation, not directly sourced. |
| AKR-000020 | Blocked | Causal `influences` may be standing in for an unresolved quality-model hierarchy. |
| AKR-000021 | Valid proposed edge | Exact cascading-failure evidence and conditions are still required. |
| AKR-000022 | Valid proposed edge | Evidence should remain limited to enforced boundaries. |
| AKR-000023 | Incorrect actor/predicate | Misvalidation introduces token confusion, not OIDC itself. |
| AKR-000024 | Incorrect actor/predicate | Failed reconciliation introduces unbounded divergence, not EDA itself. |

### Important missing relationships

These are audit observations, not authorization to create records:

- Transactional Outbox requires an idempotent consumer or equivalent duplicate handling under at-least-once delivery.
- Saga retryable steps require idempotent/effect-safe repetition.
- Eventual Consistency should have a taxonomy/model relation appropriate to the chosen consistency ontology.
- Availability needs an explicit taxonomy relation to Reliability if the repository adopts the ISO product-quality hierarchy; any separate causal relation needs independent evidence.
- OAuth 2.0 should be updated/governed by the Security BCP and related to explicit extension/profile nodes rather than hiding those semantics inside one version-family concept.
- Failure modes should connect to the control failure or condition that produces them, not to arbitrary peer failure modes.

## Corpus Completeness and Cross-Unit Assessment

All intended units exist. Each of the 20 reference units and four supporting units has all 26 expected Markdown sections and meaningful prose. No placeholder prose or disguised `TODO` content was found. The units generally stand alone for a human reader, expose applicability and non-applicability, and include security, data, operations, verification, benefits, trade-offs, examples, and counterexamples.

The principal completeness problem is representational: those sections are not reflected in structured frontmatter. Consequently:

- humans see alternatives and failure analysis;
- graph/RAG consumers see empty alternatives, risks, examples, counterexamples, assumptions, and constraints;
- relationship conditions survive only as free text;
- independent claim retrieval can detach a quality-impact statement from its unit-level trade-offs.

No direct contradiction was found between the prose definitions of availability, reliability, idempotency, or eventual consistency. The main cross-unit problems are taxonomy ambiguity, evidence strength, and undefined neighboring dependability terms rather than mutually exclusive definitions.

## Human and AI Usability Assessment

### Human use

Strengths:

- concise summaries and decision guides;
- credible rejection criteria in prose;
- explicit trade-offs and operational consequences;
- stable IDs and traceable claims/sources;
- generally careful avoidance of absolute recommendations.

Weaknesses:

- generic `Related Concepts` prose forces registry lookups;
- source sections list only IDs and do not name the supporting scope;
- evidence strength is not obvious from the knowledge-unit body;
- an ordinary reader cannot tell that licensed ISO details were not independently inspected.

### Future AI retrieval

High-risk retrieval cases:

- AKL-000006 can be returned as high-confidence direct evidence despite a missing source passage.
- AKC-000011 can cause HTTP idempotency to answer message-processing questions.
- AKR-000015 can be rendered as “observability improves reliability” without causal evidence.
- AKR-000020 can become a false causal path through the quality graph.
- OAuth/OIDC chunks can omit client type, refresh-token, sender-constraint, and token-format distinctions.
- Empty metadata can exclude risks and alternatives even when the prose contains them.
- Proposed AKR-000023 and AKR-000024 can blame a protocol/style for failures caused by misuse or failed controls.

M4 must not compensate by relying on chunk adjacency. The records themselves must preserve critical qualifiers.

## M4 Entry Conditions

M4 may begin only after all of the following are completed and independently revalidated:

1. Replace or correctly downgrade AKL-000006 with direct evidence for the six-part QAS structure.
2. Resolve Idempotency's semantic-property versus tactic roles, add protocol-neutral evidence, and migrate AKL-000011, AKL-000025, and AKR-000005.
3. Resolve Availability/Reliability public evidence and hierarchy; correct AKL-000004, AKL-000005, AKL-000040, and AKR-000020.
4. Reclassify or directly evidence AKL-000035/AKR-000015; no causal quality edge may remain on plausibility alone.
5. Migrate Eventual Consistency from `data-pattern` to an appropriate consistency-model/system-property type.
6. Remove the recursive failure-mode requirement and its arbitrary peer references; add negative/regression validation.
7. Complete OAuth/OIDC guidance against RFC 9700, including client types, PKCE rules, refresh-token protection, replay, sender constraint, token formats, and discouraged flows.
8. Replace the ambiguous OAuth 2.x version-family model with an explicit umbrella/version/profile decision and migration.
9. Remove or remodel AKR-000023 and AKR-000024 so the failing control/misuse is the actor.
10. Synchronize structured metadata with the already-authored risks, alternatives, examples, counterexamples, assumptions, constraints, and rejection conditions.
11. Apply the Qualified claim and weak-relationship dispositions or explicitly exclude those records from M4 traversal until corrected.
12. Rerun the full pnpm baseline, regenerate/check integrity reports if production records change, and perform a focused semantic re-audit. Green automation alone remains insufficient.

## Final Verdict

HOLD M4

## Remediation Status Appendix — 2026-07-30

This appendix records implementation status only. It does not alter, erase, or retroactively approve the independent audit findings. The detailed one-to-one evidence is in `docs/m3-semantic-remediation-report.md`.

| Finding | Remediation status |
|---|---|
| M3-AUD-001 | Remediated: QAS source scope narrowed; six-field template labeled corpus convention. |
| M3-AUD-002 | Remediated: Idempotency semantic roles separated; broad retry edge excluded. |
| M3-AUD-003 | Remediated: public-source scope and non-causal Availability/Reliability overlap. |
| M3-AUD-004 | Remediated: Observability causal improvement removed. |
| M3-AUD-005 | Remediated: Eventual Consistency migrated to `consistency-model`. |
| M3-AUD-006 | Remediated: recursive failure-mode rule and arbitrary references removed. |
| M3-AUD-007 | Remediated: RFC 9700 and OIDC security boundaries applied. |
| M3-AUD-008 | Remediated: OAuth 2.x migrated to explicit OAuth 2.0 framework model. |
| M3-AUD-009 | Remediated: failure-mode actors and non-causal context predicates applied. |
| M3-AUD-010 | Remediated: structured metadata populated and projection validated. |
| M3-AUD-011 | Remediated: all 15 Qualified claim dispositions applied. |
| M3-AUD-012 | Remediated: every identified weak relationship repaired or excluded from traversal. |
| M3-AUD-013 | Remediated: all empty-ID conditions reviewed and explicitly scoped edge-local. |
| M3-AUD-014 | Remediated: five dependability terms have governed boundaries. |
| M3-AUD-015 | Remediated: concept-specific Related Concepts prose and boilerplate validator. |
| M3-AUD-016 | Accepted design: primary types retained with explicit contextual roles. |

No lifecycle status was promoted by this remediation. The original audit verdict remains `HOLD M4` until a separate independent re-audit decides otherwise.
