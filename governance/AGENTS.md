# Lifecycle Event Instructions

- Treat lifecycle events as append-only audit metadata.
- Never fabricate human authorization, actors, timestamps, or evidence.
- Human-only transitions require a human actor, explicit authorization, and
  non-empty authorization evidence.
- Event chains must begin at the lifecycle's initial state and remain
  chronological and contiguous.
- Source admission, content lifecycle, maturity, and confidence remain separate.
