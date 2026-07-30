# M3 Semantic Remediation Report

Date: 2026-07-30
Scope: M3 semantic remediation only
Target gate: `READY FOR M3 RE-AUDIT`

This report is machine-authored, proposed, and not human-reviewed, approved, published, or canonical. It does not declare M4 readiness.

## Outcome

All ten High findings and every relevant Medium finding from the independent audit have a concrete disposition. Incorrect sourced scope, taxonomy, causal quality semantics, failure attribution, recursive failure-mode policy, and structured-metadata gaps were corrected. Weak and proposed edges that still lack direct evidence are explicitly excluded from future traversal.

No source was added, admitted, promoted, or changed. Existing admitted sources AKS-000001 through AKS-000022 remain subject to their admission boundaries.

## One-to-one remediation matrix

| Finding ID | Severity | Affected records | Root cause | Required correction | Files changed | Validation added | Disposition |
|---|---|---|---|---|---|---|---|
| M3-AUD-001 | High | AKC-000006, AKL-000006 | AKS-000004 did not expose the attributed six-part template. | Narrow the sourced claim and identify the template as corpus synthesis. | QAS unit; AKL-000006 | Production remediation contract | Remediated: source claim now covers general/concrete scenario reasoning only; six-field form is an editorial convention. |
| M3-AUD-002 | High | AKC-000011, AKL-000011, AKL-000025, AKR-000005 | HTTP semantics, operation effects, and tactics were collapsed. | Separate roles and prevent concept-global overreach. | Concept vocabulary/schema; Idempotency unit; claims; AKR-000005 | Type-registry consistency; traversal gate; production contract | Remediated: `semantic-property` umbrella, RFC 9110-only claim, qualified duplicate-effect claim, edge excluded from traversal. |
| M3-AUD-003 | High | AKC-000004, AKC-000005, AKL-000004, AKL-000005, AKL-000040, AKR-000020 | Inaccessible ISO detail and taxonomy were treated as verified causality. | Use inspectable scope and an explicit non-causal terminology decision. | Availability/Reliability units; claims; relationship vocabulary/schema; AKR-000020 | Quality-attribute causal-edge rejection | Remediated: public operational scope, medium-confidence synthesis, conditioned `overlaps-with`; no ISO hierarchy asserted. |
| M3-AUD-004 | High | AKC-000019, AKL-000035, AKR-000015 | Plausible operational benefit was encoded as sourced causal improvement. | Remove causal guarantee and model an evidenced intermediary. | Observability unit; AKL-000035; AKR-000015 | Inferential quality-impact traversal rejection | Remediated: `supports-investigation-of`, low-confidence inference, traversal excluded. |
| M3-AUD-005 | High | AKC-000016 | A consistency model was typed as a data pattern. | Add and assign `consistency-model`. | Concept vocabulary/schema; Eventual Consistency unit | Registry–schema consistency coverage | Remediated with stable ID and explicit contextual roles. |
| M3-AUD-006 | High | AKC-000021–AKC-000024; validation policy | Failure modes were forced to reference peer failure modes. | Remove recursive requirement and artificial references. | Policy; four supporting units; Markdown validator tests | Terminal failure-mode regression | Remediated: failure modes may be standalone; all four arbitrary arrays are empty. |
| M3-AUD-007 | High | AKC-000017, AKC-000018 and security claims | RFC 9700 controls and token/client boundaries were incomplete. | Apply current admitted BCP and OIDC boundaries contextually. | OAuth/OIDC units; affected claims | Security threat-assumption and production contract checks | Remediated against admitted RFC 6749, RFC 9700, and OIDC Core scope. |
| M3-AUD-008 | High | AKC-000017 | “OAuth 2.x” implied a finalized protocol family. | Choose an explicit version/framework/BCP model. | OAuth unit path/title; ledger human-key history; ADR | Human-key history and production contract | Remediated: stable ID now represents OAuth 2.0; BCP/extensions/profiles are explicit roles; OAuth 2.1 is not presented as final. |
| M3-AUD-009 | High | AKL-000047, AKL-000048, AKR-000023, AKR-000024 | Protocol/style was used as actor for control failure. | Make the observed failure the subject and use a non-causal context predicate. | Claims and relationships 23/24; relationship vocabulary/schema | Incorrect-actor production contract | Remediated: failure-mode subjects use `can-occur-in-context-of`; both remain proposed and non-traversable. |
| M3-AUD-010 | High | All 24 knowledge units | Structured fields contradicted substantive prose by being empty. | Populate normalized qualified metadata and define projection authority. | All knowledge units; schemas; policy; Markdown validator; ADR | Required structured metadata and projection-consistency regressions | Remediated across constraints, assumptions, risks, alternatives, examples, and counterexamples. |
| M3-AUD-011 | Medium | Fifteen Qualified sourced claims | Claim type, confidence, or transfer scope exceeded source proximity. | Apply every Source Fidelity Matrix disposition. | AKL-000001, 000002, 000003, 000010, 000012, 000020, 000021, 000026, 000027, 000030, 000033, 000036, 000037, 000038, 000039 | Production contract and grounding validation | Remediated; individual dispositions are recorded below. |
| M3-AUD-012 | Medium | AKR-000001, 000006, 000007, 000009, 000013, 000017, 000018, 000019 | Weak, broad, redundant, or low-information edges remained graph-visible. | Repair or withhold every weak edge. | All relationship records; schema; validator | Explicit traversal eligibility checks | Remediated: all eight named edges are non-traversable; precise reasons are stored on each record. |
| M3-AUD-013 | Medium | AKR-000001–AKR-000024 | Empty condition IDs did not distinguish reusable context from local qualification. | Review every condition and declare scope. | All relationships; shared schema; validator; ADR | `REL_CONDITION_SCOPE` regressions | Remediated: all 24 are deliberately `edge-local`; no generic reusable node was fabricated. |
| M3-AUD-014 | Medium | Dependability terminology | Adjacent terms lacked governed boundaries. | Govern Availability, Reliability, Resilience, Fault Tolerance, and Recoverability. | Quality-attribute registry; Availability/Reliability units; schema | Registry schema validation | Remediated with definitions and explicit non-synonym boundaries. |
| M3-AUD-015 | Low | All knowledge units | Generic Related Concepts boilerplate added no semantic value. | Replace it with concept-specific explanations. | All 24 units; Markdown validator | Boilerplate rejection regression | Remediated. |
| M3-AUD-016 | Observation | AKC-000007, AKC-000019 | One primary type underrepresented legitimate contextual roles. | Retain defensible primary types and record roles. | Modular Monolith and Observability metadata; ADR | Knowledge schema validation | Accepted design with explicit contextual roles; no lifecycle promotion. |

Coverage proof: the matrix contains exactly M3-AUD-001 through M3-AUD-016; no finding is omitted.

## Source Fidelity Matrix dispositions

### Seven formerly Blocked sourced claims

| Claim | Correction |
|---|---|
| AKL-000004 | Narrowed to inspectable operational availability scope; ISO detail removed; confidence medium. |
| AKL-000005 | Recast as medium-confidence public-source synthesis with an explicit corpus boundary. |
| AKL-000006 | Narrowed to general/concrete scenario reasoning; fixed six-field attribution removed. |
| AKL-000011 | Narrowed to RFC 9110 HTTP method semantics only. |
| AKL-000025 | Targets qualified duplicate-effect control, not a universal idempotency equivalence. |
| AKL-000035 | Causal improvement removed; low-confidence investigation-support inference. |
| AKL-000040 | Causal edge replaced by conditioned, non-hierarchical overlap. |

### All fifteen Qualified sourced claims

| Claim | Disposition |
|---|---|
| AKL-000001 | Reclassified as low-confidence synthesis; historical-to-software transfer made explicit. |
| AKL-000002 | Reclassified as medium-confidence synthesis; aerospace transfer retained. |
| AKL-000003 | Narrowed to a scoped condition that must be satisfied; unsupported three-way terminology attribution removed. |
| AKL-000010 | Reclassified as medium-confidence synthesis from one vendor architecture guide. |
| AKL-000012 | Reclassified as medium-confidence synthesis; absolute “only” removed. |
| AKL-000020 | Narrowed to AKS-000021; ISO architecture-description page no longer treated as ADR-format evidence. |
| AKL-000021 | Reclassified as low-confidence repository inference; direct comparison is not claimed. |
| AKL-000026 | Low-confidence recommendation; no measured availability gain asserted. |
| AKL-000027 | Low-confidence inference limited to caller-capacity preservation. |
| AKL-000030 | Narrowed to the database/message-intent dual-write boundary; confidence medium. |
| AKL-000033 | Reframed as the authentication/authorization and token-role boundary, not redundant compatibility. |
| AKL-000036 | Low-confidence risk inference; no intrinsic reliability degradation asserted. |
| AKL-000037 | Low-confidence cross-practice recommendation. |
| AKL-000038 | Low-confidence inference requiring a specific authoritative excluding constraint. |
| AKL-000039 | Low-confidence repository recommendation, not a direct sourced relationship. |

No known incorrect claim remains presented as a sourced direct or normalized claim outside its admitted scope.

## Relationship Quality Assessment dispositions

| Relationship | Disposition | Future traversal |
|---|---|---|
| AKR-000001 | Retained as qualified inference; direct comparison missing. | Excluded |
| AKR-000002 | Accepted alternative edge. | Eligible |
| AKR-000003 | Accepted demonstrated compatibility. | Eligible |
| AKR-000004 | Accepted conditioned coexistence. | Eligible |
| AKR-000005 | Duplicate-effect requirement retained only in claim context; umbrella target is multi-role. | Excluded |
| AKR-000006 | Qualified availability recommendation. | Excluded |
| AKR-000007 | Qualified caller-capacity inference. | Excluded |
| AKR-000008 | Accepted coordinated tactics. | Eligible |
| AKR-000009 | Broad publication-to-EDA direction retained for audit history. | Excluded |
| AKR-000010 | Narrowed to the dual-write reliability boundary. | Eligible |
| AKR-000011 | Accepted conditioned convergence dependency. | Eligible |
| AKR-000012 | Accepted asynchronous independent-state condition. | Eligible |
| AKR-000013 | Redundant compatibility retained for stable-ID history. | Excluded |
| AKR-000014 | Accepted direct OIDC protocol dependency. | Eligible |
| AKR-000015 | Replaced causal `improves` with `supports-investigation-of`. | Excluded |
| AKR-000016 | Replaced measurable `degrades` with qualified `presents-risk-to`. | Excluded |
| AKR-000017 | Retained as an explicit cross-practice recommendation. | Excluded |
| AKR-000018 | Generic constraint edge retained only for audit history. | Excluded |
| AKR-000019 | Retained as an explicit cross-method recommendation. | Excluded |
| AKR-000020 | Replaced causality with conditioned symmetric `overlaps-with`. | Eligible |
| AKR-000021 | Retained proposed; direct cascading-feedback evidence missing. | Excluded |
| AKR-000022 | Retained proposed; continuous boundary-enforcement evidence incomplete. | Excluded |
| AKR-000023 | Actor corrected to Token Role Confusion; precise non-causal context predicate. | Excluded |
| AKR-000024 | Actor corrected to Unreconciled State Divergence; precise non-causal context predicate. | Excluded |

All conditions on AKR-000001 through AKR-000024 were reviewed individually. Each is specific to its subject, object, predicate, and evidence scope, so every empty `concept_ids` list is explicitly `edge-local`. No condition had stable reusable identity sufficient to justify a new constraint, assumption, or context concept in this run.

## Proposed record review

No proposed record was promoted.

| Record | Disposition | Missing evidence or qualification | Future graph use |
|---|---|---|---|
| AKL-000041 | Retain proposed | Direct retry-storm/cascading-feedback evidence and measurable path. | Blocked by AKR-000021 exclusion. |
| AKL-000042 | Retain proposed project synthesis | Evidence separating structural, data, release, and ownership erosion. | Blocked by absence of sourced traversal edge. |
| AKL-000043 | Retain proposed security synthesis | Exact token substitution, issuer, audience, client, and role passages. | No sourced traversal edge. |
| AKL-000044 | Retain proposed inference | Direct repair and convergence-bound evidence. | No sourced traversal edge. |
| AKL-000045 | Retain proposed with AKS-000012 | Aggregate retry overload is supported; generalized cascade evidence remains missing. | AKR-000021 excluded. |
| AKL-000046 | Retain proposed recommendation | General evidence for continuously enforced boundaries beyond one case. | AKR-000022 excluded. |
| AKL-000047 | Rewrite proposed | Failure mode is actor; exact OIDC/RFC 9700 threat passages still needed. | AKR-000023 excluded. |
| AKL-000048 | Rewrite proposed | Failure mode is actor; direct repair and convergence evidence still needed. | AKR-000024 excluded. |
| AKR-000021 | Retain proposed | Direct cascading feedback evidence. | Excluded. |
| AKR-000022 | Retain proposed | General boundary-enforcement evidence. | Excluded. |
| AKR-000023 | Replace semantics | `can-occur-in-context-of` with failure-mode subject; exact evidence pending. | Excluded. |
| AKR-000024 | Replace semantics | `can-occur-in-context-of` with failure-mode subject; exact evidence pending. | Excluded. |

## Taxonomy and terminology decisions

ADR 0003 records the required previous classification, selected classification, contextual roles, rejected alternatives, reasoning, and migration impact for Idempotency, Eventual Consistency, Modular Monolith, Observability, and OAuth 2.x.

The governed quality registry now distinguishes:

- Availability: readiness for a specified usable service under stated conditions and a window.
- Reliability: continuity of correct service under stated conditions over time.
- Resilience: broader ability to withstand, adapt to, and recover from disruption.
- Fault Tolerance: continued specified service despite specified faults.
- Recoverability: restoration of service and required state after failure.

These terms are not synonyms. Their contextual interaction requires separate claims and measures.

## OAuth/OIDC security corrections

| Area | Correction and admitted authority |
|---|---|
| Version model | AKC-000017 is the RFC 6749 OAuth 2.0 framework; RFC 9700 is its Security BCP; extensions/profiles remain separate; OAuth 2.1 is not represented as finalized. |
| Client types | Public and confidential clients are separated; credential capability and client authentication are deployment-specific. |
| Authorization code and PKCE | Modern user-facing flow guidance uses code protections; public clients require PKCE under RFC 9700 scope. |
| Redirects and discouraged grants | Exact redirect matching is explicit; resource-owner password credentials must not be used; implicit is not the modern default. |
| Refresh and replay | Rotation or sender constraint for public-client refresh tokens, replay detection, revocation response, and bearer replay risks are explicit. |
| Sender constraint | mTLS/DPoP are contextual mechanisms where threat model or selected profile calls for them, not universal defaults. |
| Audience and privilege | Resource audience, intended recipient, and least privilege are explicit resource-server concerns. |
| Token formats and roles | ID Token is a JWT authentication assertion for its relying party; OAuth access-token format is not universally JWT; access tokens are not identity assertions. |
| Browser/native context | User-agent exposure and public-client limitations are explicit; no shared secret is treated as making a public client confidential. |
| Protocol versus deployment policy | RFC 6749 semantics, RFC 9700 BCP, extension/profile requirements, and local application authorization are separately labeled. |

Normative security statements in the units identify AKS-000017, AKS-000018, or AKS-000019 as applicable. No new or unapproved evidence is used.

## Schema and validator corrections

- Added assignable `semantic-property` and `consistency-model` types.
- Added governed dependability definitions and boundaries.
- Added qualified structured statements and contextual roles to the knowledge schema.
- Added explicit condition scope and relationship traversal contracts.
- Added precise relationship predicates and non-causal quality overlap.
- Removed `failure-mode` from recursive failure-sensitive policy.
- Required non-empty structured metadata and rejected generic Related Concepts boilerplate.
- Validated metadata projections for risks, alternatives, examples, and counterexamples.
- Rejected incorrectly scoped conditions, traversal of proposed/context-only edges, inferential traversable quality impacts, and causal quality-attribute taxonomy edges.

## Tests added or expanded

- Standalone terminal failure-mode regression.
- Structured metadata non-empty and Markdown projection regressions.
- Generic Related Concepts boilerplate regression.
- Edge-local versus reusable condition-scope regressions.
- Proposed and claim-context traversal rejection.
- Inferential quality-impact traversal rejection.
- Quality taxonomy-versus-causality rejection.
- Production semantic contract covering every High finding, including incorrect actor attribution and OAuth/OIDC boundaries.

## Files changed

Production changes cover ontology registries, validation policy, JSON Schemas, TypeScript validators, all 24 knowledge units, all 48 claims, all 24 relationships, the ID ledger path/human-key migration for AKC-000017, tests/fixtures, ADR 0003, this report, and the audit appendix. Deterministic integrity reports are regenerated at the exit gate.

## Source changes and human decisions

No source registry or source lifecycle change was made. No remediation source-admission proposal is needed for the corrected current corpus because unsupported scopes were narrowed or explicitly left proposed and non-traversable.

Future human source admission is still required before proposed claims that name missing direct evidence can be sourced. This run does not request or imply that approval.

## Validation results

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass; lockfile current, dependencies already present. |
| `pnpm format:check` | Pass; all matched files conform to Prettier. |
| `pnpm validate` | Pass; schema, vocabulary, IDs, sources, claims, relationships, lifecycle, Markdown, and links report 0 errors and 0 warnings. |
| `pnpm test` | Pass; 17 files and 72 tests. |
| `pnpm test:coverage` | Pass; 96.04% statements, 83.14% branches, 99.12% functions, and 97.07% lines. |
| `pnpm report:integrity` pass 1 | Pass; 12 deterministic reports written. |
| `pnpm report:integrity` pass 2 | Pass; the same 12 deterministic reports written. |
| `pnpm report:check` | Pass; 12/12 current. |
| `pnpm exec stryker run --mutate "src/markdown-validator.ts,src/relationship-validator.ts"` | Pass; 60.15% aggregate mutation score against the unchanged 60% break threshold. Relationship Validator scores 64.20%; Markdown Validator scores 52.63%. |
| `git diff --check` | Pass; no whitespace errors. Git reports only the existing line-ending normalization notice for `validation/policies.yaml`. |

Mutation testing instrumented 1,044 mutants and executed 542 covered mutants: 317 killed, 9 timed out, 181 survived, 35 had no coverage, and 0 errored. The Markdown score is a residual non-blocking test-strength risk; the new M3 semantic gates themselves have direct regressions, and no threshold was lowered.

## Remaining risks and unresolved findings

No Critical or High semantic finding remains open in sourced/traversable production state. Residual evidence gaps are explicit on the eight proposed claims and four proposed relationships, and those edges are excluded from traversal.

Potential future reusable condition concepts, a broader Observability type, a standalone OAuth Security BCP concept, and direct evidence for proposed failure edges remain non-blocking design/evidence questions for a later scoped run. They are not silently treated as resolved facts.

## Exit status

`READY FOR M3 RE-AUDIT`

This is not an M4 readiness decision. Only a separate independent semantic re-audit may change the original `HOLD M4` verdict.
