# Governance

## Authority boundaries

Automation may propose, structure, cross-link, and validate knowledge. Humans
remain authoritative for semantic review and publication. Repository
maintainers control ontology and schema evolution; domain reviewers assess
subject accuracy; source stewards manage source admission.

No current file conveys appointment of a maintainer, steward, or reviewer.
Ownership fields may remain empty until humans assign responsibility.

## Controlled changes

The following require an explicit design record and migration analysis:

- concept-type additions, merges, splits, or semantic changes;
- relationship predicate or direction changes;
- identifier namespace changes;
- lifecycle transition changes;
- schema changes that invalidate existing records;
- source-quality threshold changes.

## Lifecycle authority

Automation may perform:

```text
proposed -> source-candidate -> sourced -> drafted
drafted -> schema-valid -> content-validated -> human-review
```

Only an authorized human may perform:

```text
human-review -> reviewed
reviewed -> published
```

Deprecation and supersession also require an accountable human decision because
they change what readers should rely on. A superseded record must point to its
replacement. Lifecycle transitions must eventually be auditable events, not
only overwritten fields.

## Source admission

Source status is governed separately. `approved` means a source may support
claims subject to scope and quality; it never makes those claims or downstream
content approved. `restricted` sources require usage notes. `rejected` sources
must not support claims. Deprecated or superseded sources trigger review, not
automatic deletion.

## Disputes and uncertainty

Record competing interpretations, their assumptions, and their evidence.
Prefer scoped coexistence to premature unification. Unresolved foundational
questions live in `docs/kernel-decisions.md`.
