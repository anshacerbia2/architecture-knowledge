# Distributed-Systems Knowledge Instructions

In addition to parent instructions, make assumptions explicit for:

- synchrony and timing;
- network loss, duplication, delay, partition, and reordering;
- process crash, pause, recovery, and correlated failure;
- consistency and isolation;
- message ordering and delivery;
- retry, idempotency, deduplication, and replay;
- quorum, membership, leadership, and clock behavior where relevant;
- backpressure, overload, and capacity;
- observability and recovery.

Do not claim exactly-once behavior without defining the boundary, state model,
failure model, and verification. Distinguish safety from liveness and protocol
guarantees from implementation and operational assumptions.
