# Identifier Ledger Instructions

- Every production record ID must have exactly one ledger allocation.
- Never delete retired allocations or reuse their IDs.
- Keep `record_kind` and path consistent with the record. Every active concept
  allocation requires a globally unique, non-null `human_key`; the opaque ID
  remains canonical.
- A reserved active allocation may use a null path only before its record is
  committed.
- Resolve parallel allocation collisions before merge; do not silently rewrite
  an already merged identifier.
