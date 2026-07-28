# Identifier Ledger Instructions

- Every production record ID must have exactly one ledger allocation.
- Never delete retired allocations or reuse their IDs.
- Keep `record_kind`, path, and optional `human_key` consistent with the record.
- A reserved active allocation may use a null path only before its record is
  committed.
- Resolve parallel allocation collisions before merge; do not silently rewrite
  an already merged identifier.
