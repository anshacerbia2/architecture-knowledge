# M4 Graph and Query Layer

The M4 graph is a deterministic projection of validated repository records. It
is not a source of truth, search engine, recommendation system, or RAG layer.

## Artifacts

`generated/graph/` contains the complete graph, node and edge views, forward
and reverse adjacency, traversal decisions, orphan analysis, and manifest.
`generated/indexes/` contains exact metadata indexes for concepts, claims,
relationships, and sources. Every file uses graph contract version 1 and is
generated with stable ordering and POSIX-style repository-relative paths.

The graph uses concept, claim, source, and relationship nodes. Semantic
relationship edges retain their governed predicate, direction, lifecycle,
confidence, semantic scope, conditions, evidence, and traversal disposition.
Provenance edges make these chains machine-consumable:

```text
concept -> declares-claim -> claim -> supported-by -> source
relationship -> supported-by-claim -> claim -> supported-by -> source
claim -> derived-from -> claim
claim -> applicable-to -> concept
```

## Commands

```bash
pnpm graph:generate
pnpm graph:check
pnpm graph:query -- get AKC-000018
pnpm graph:query -- neighbors AKC-000018 --direction both
pnpm graph:query -- neighbors AKC-000018 --include-excluded
pnpm graph:query -- traverse AKC-000008 --max-depth 3
pnpm graph:query -- path AKC-000008 AKC-000016 --max-depth 4
pnpm graph:query -- claims AKC-000018 --claim-type normalized-source-claim
pnpm graph:query -- evidence AKL-000061
pnpm graph:query -- explain AKR-000010
pnpm graph:query -- dependents AKS-000019
pnpm graph:query -- list relationships --traversal-eligible false
pnpm graph:query -- query --file query.json
```

`graph:generate` first requires the existing repository validation boundary to
pass. `graph:check` computes expected artifacts without writing and fails for a
missing, stale, or manually modified artifact.

## Query defaults and bounds

JSON is the authoritative output mode. Every result uses:

```json
{
  "query": {},
  "result_count": 0,
  "results": [],
  "diagnostics": [],
  "graph_contract_version": 1
}
```

Neighbor queries inspect both directions and return traversal-eligible
relationships by default. `--include-excluded` adds excluded relationships with
explicit labels and their governed exclusion reasons. Traversal and path
queries use outgoing eligible edges by default. Direction may be `outgoing`,
`incoming`, or `both`. Incoming results keep the original predicate; they do
not claim an inverse relationship.

Traversal defaults to depth 3 and rejects values outside 1 through the hard
limit of 8. Visited-node protection terminates cycles. Returned paths include
ordered node IDs, relationship IDs, predicates, full edge qualifiers, and
evidence references. Edge-local conditions are returned as unevaluated
qualifiers; M4 does not assume that a caller's context satisfies them.

## Exact index filters

Concepts support exact type, domain, status, title, and human-key filters.
Claims support subject, predicate, governed object ID, claim type, semantic
scope, confidence, status, source, applicable concept, and normative force.
Relationships support endpoints, predicate, status, confidence, semantic
scope, traversal eligibility, supporting claim, and resolved source. Sources
support title, type, status, publisher, authority, and domain.

Matching is case-sensitive and exact. Multiple values of the same filter are
ORed; different filters are ANDed. Unsupported filters fail with a stable
diagnostic. M4 provides no tokenization, fuzzy matching, ranking, or semantic
similarity.

## Structured query contract

The `query` command accepts a JSON file. Node constraints and relationship
constraints are ANDed:

```json
{
  "node": {
    "types": ["protocol"],
    "domains": ["security-privacy"]
  },
  "relationships": [
    {
      "predicate": "depends-on",
      "target": "AKC-000017"
    }
  ],
  "traversable_only": true
}
```

Targets resolve only by stable ID, exact current human key, or exact title. A
correct empty result carries `GRAPH_QUERY_EMPTY`; graph data is never invented
to satisfy a query.

## Common diagnostics

- `GRAPH_ID_UNKNOWN`: no exact governed identifier resolved.
- `GRAPH_DIRECTION_INVALID`: direction is not outgoing, incoming, or both.
- `GRAPH_DEPTH_INVALID`: depth is not an integer from 1 through 8.
- `GRAPH_FILTER_UNSUPPORTED`: a CLI flag is outside the command contract.
- `GRAPH_QUERY_FILE`: the structured-query file cannot be read or parsed.
- `GRAPH_SCHEMA_VERSION`: committed artifacts use a different contract.
- `MISSING` or `STALE` from `graph:check`: regenerate and review graph output.

## Limitations and M5 boundary

M4 performs exact metadata filtering and bounded governed traversal only. It
does not evaluate conditions, search prose, parse natural language, calculate
semantic similarity, rank results, call an LLM, or produce architecture advice.
Those capabilities remain outside M4. See ADR 0005 for the migration contract.

