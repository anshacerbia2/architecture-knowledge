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
source citations derived from the guide's claim evidence chain. With no production guide corpus,
both committed counts are zero; the synthetic regression suite proves the non-empty path.

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

```bash
pnpm validate:decision-guides
pnpm graph:check
pnpm retrieval:units:check
pnpm test
pnpm test:coverage
pnpm test:mutation:decision-guides
pnpm report:check
```
