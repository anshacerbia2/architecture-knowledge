# M7.1 Decision Guide Validation Kernel

This guide documents the validation and projection boundary only. No production decision-guide
corpus, assistant runtime, model integration, or ADR/RFC/PAD generator exists in M7.1.

## Record boundaries

| Contract                              | Purpose                            | Persistence and authority                                      |
| ------------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `decision-guide.schema.json`          | Reusable governed decision support | Governed `AKG`; lifecycle remains `proposed` unless humans act |
| `decision-session.schema.json`        | Project-specific context           | Ephemeral-only; not a governed record                          |
| `decision-recommendation.schema.json` | Contextual comparison result       | Recommendation only; human decision required                   |
| `decision-artifact-draft.schema.json` | Portable ADR/RFC/PAD draft shape   | Draft only; automation cannot accept or approve                |

## Guide invariants

`pnpm validate:decision-guides` checks semantic rules that JSON Schema cannot:

- unique context keys, options, and criteria;
- resolvable concepts with constraint, assumption/context-condition, and quality-attribute type
  boundaries;
- exact option-by-criterion matrix completeness;
- declared option references in rules, risks, and evolution triggers;
- exact nested claim inventory;
- `sourced` claim state and transitive admitted-source grounding;
- claim applicability to the concepts being assessed;
- preservation of all claim conditions; and
- consistency between context sensitivity and the guide privacy policy.

Diagnostics use stable `DG_*` codes. Schema constants independently prevent a guide or output
contract from granting automation approval authority.

## Graph and retrieval

Graph contract v2 adds `decision-guide` nodes and `generated/indexes/decision-guides.json`. The
index preserves the full record plus evidence-chain claim IDs, admitted source metadata, option IDs,
constraint IDs, and quality-attribute IDs. Provenance edges are non-traversable semantic references,
while any future semantic traversal still requires a governed relationship and existing default-deny
rules.

Useful commands after a guide corpus is separately authorized:

```bash
pnpm graph:query get AKG-000001
pnpm graph:query list decision-guides --status proposed
pnpm retrieval:query -- "decision context" --unit-kind decision-guide-overview
```

Retrieval contract v2 adds `decision-guide-overview` and `decision-guide-section`. Units retain
source citations derived from the guide's claim evidence chain. At M7.1 delivery,
both committed counts were zero; synthetic regressions proved the non-empty path.
The subsequent [M7.2 pilot](m7-2-corpus-pilot.md) now supplies three proposed guides
without granting content approval or runtime authorization.

## Privacy, uncertainty, and injection boundary

- Sessions are ephemeral-only.
- Context values carry classification, provenance, and human-confirmation metadata.
- External processing is either prohibited by the guide or requires explicit, scoped session
  authorization evidence: actor, time, purpose, provider, classifications, and expiry.
- Recommendations repeat the applicable context and constraint outcomes; affirmative recommendations
  require viable options, trade-offs, verification, claims, and admitted sources.
- Project text is untrusted data. It cannot alter evidence, privacy, lifecycle, or authority
  contracts.
- Missing or conflicting evidence remains explicit; it cannot be converted into a confident
  recommendation.
- A recommendation or draft is never evidence of human acceptance.

These are contracts for a future runtime, not a runtime implementation.

## Validation commands

The [first focused hardening migration](m7-1-hardening-report.md) introduced the
v3 guide and v2 session/recommendation boundary. The subsequent
[decision-basis migration](m7-1-decision-basis-remediation-report.md) requires
guide schema v4 and session/recommendation contract v3, with current
`guide_version` and a deterministic `decision_basis` evidence inventory.
The [M7.2 output-coverage migration](m7-2-output-coverage-remediation.md) now
requires recommendation contract v4; session remains v3. Results explicitly
partition assessed options into viable, rejected, and inapplicable options.
Every trade-off, risk, verification, and evolution statement declares its
`option_ids`, limited to viable options. Trade-off and verification coverage
must each include every viable option.
Schema success alone is not
recommendation clearance: use the pure semantic validator or
`pnpm decision:validate -- session.json recommendation.json`. No input is persisted
by this command. Guide citation support is binding-local; whole-guide provenance
is separate metadata, not a section's evidence.

For every selected or rejected option, the semantic gate includes its option
binding and all active recommendation/avoidance/disqualifier rules. Known
constraint outcomes, affirmative guide assumptions and declared quality drivers
also contribute their own binding evidence. The output lists exact
`guide_pointer`/`claim_ids` entries; the validator reconstructs them independently
and verifies the transitive evidence. Unrelated risk-section provenance does not
become decision support. Rejection requires an active exclusion rule; comparative
ranking without such a rule is not implemented by this kernel.

An inapplicable option requires at least one selection rule, all its selection
rules false, all exclusion rules false, and every rule condition known and
human-confirmed. Unknown applicability is not inapplicability. Its option binding
and every selection/exclusion binding remain in the evidence basis, including
false rules. These are evaluation evidence, not active recommendations. All
sources, locators, snapshots and uncertainty remain mandatory. Conditions on
evidence also used by an active assertion, including shared transitive ancestors,
must still hold. No result grants approval or proves free-text entailment.

Condition matching preserves statement text, scope and the concept-reference set.
Driver IDs must resolve with the declared role and guide membership; a required
constraint driver must be a hard constraint. Empty context is supported for
non-affirmative clarification, while affirmative required-context checks remain.

```bash
pnpm validate:decision-guides
pnpm graph:check
pnpm retrieval:units:check
pnpm test
pnpm test:coverage
pnpm test:mutation:decision-guides
pnpm report:check
```
