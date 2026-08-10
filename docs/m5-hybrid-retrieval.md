# M5 Hybrid Search and Retrieval

M5 retrieves bounded governed context; it does not generate architecture
answers. Repository records and the current M4 graph remain authoritative.
PostgreSQL, full-text documents, and vectors are replaceable derived state.

## Local setup

Requirements are the repository-pinned Node.js and pnpm versions plus Docker
with Compose for local PostgreSQL. Copy environment values from `.env.example`
into your shell; the example contains no secret.

```bash
pnpm install --frozen-lockfile
pnpm graph:check
pnpm retrieval:units:check
pnpm retrieval:db:up
pnpm retrieval:migrate
pnpm retrieval:index
pnpm retrieval:check
```

The default adapter is the deterministic fake used for correctness testing. It
does not provide production semantic quality. To build a real production
generation, set `RETRIEVAL_EMBEDDING_PROVIDER=openai`, provide
`OPENAI_API_KEY`, retain the public classification allowlist, migrate, and
index again. The production contract is OpenAI `text-embedding-3-small`, 1536
dimensions, cosine distance.

Shut down disposable local state with:

```bash
pnpm retrieval:db:down
```

That command removes only the Compose resources and named retrieval volume
declared in `docker-compose.retrieval.yml`.

## Generated artifacts and indexing

`pnpm retrieval:units` generates `generated/retrieval/units.json` and
`manifest.json`; never hand-edit them. `retrieval:units:check` is the read-only
currentness gate. Vectors are not committed.

`retrieval:index` performs a full generation build. Compatible embeddings may
be reused by content hash plus provider/model/dimension/normalization contract.
Activation is atomic. A failed generation cannot replace the current active
one. `retrieval:check` verifies both generation metadata and the recomputed
database row manifest. A changed repository commit, graph fingerprint,
retrieval manifest, metadata, citation, vector presence/dimension, or contract
causes `RETRIEVAL_INDEX_NOT_CURRENT`.

## Query modes

```bash
pnpm retrieval:query -- "AKC-000014" --mode lexical --top-k 5 --json
pnpm retrieval:query -- "avoid losing an event after saving data" --mode vector --json
pnpm retrieval:query -- "duplicate payment processing" --mode hybrid --json
pnpm retrieval:query -- "identity token validation" --mode hybrid-graph --graph-depth 1 --json
pnpm retrieval:query -- --file retrieval-query.json
```

Modes are `lexical`, `vector`, `hybrid`, and `hybrid-graph`. Graph expansion is
off outside `hybrid-graph`, defaults to one hop, and cannot exceed two.
`AKR-000010` and every other M4-excluded edge remain inspectable retrieval
units but can never become expansion paths.

The structured request contract is:

```json
{
  "text": "How do I prevent duplicate payment processing?",
  "mode": "hybrid-graph",
  "top_k": 10,
  "candidate_k": 40,
  "filters": {
    "concept_types": [],
    "domains": [],
    "statuses": [],
    "claim_types": [],
    "semantic_scopes": [],
    "minimum_confidence": null,
    "normative_forces": [],
    "unit_kinds": []
  },
  "graph": { "enabled": true, "max_depth": 1, "predicates": [] },
  "budget": {
    "max_units": 10,
    "max_estimated_tokens": 4000,
    "max_units_per_concept": 3
  },
  "explain": true,
  "allow_degraded_lexical_fallback": false
}
```

Unknown properties, wrong types, unsupported modes or filters, invalid limits,
depth above two, excessive or empty text, and malformed JSON fail closed with
`RETRIEVAL_QUERY_SHAPE` or a more specific stable diagnostic. Query text,
filter values, limits, and vectors are PostgreSQL parameters; caller-provided
SQL, `tsquery`, and vector literals are unsupported.

## Result packet

Every packet contains contract version, normalized query, immutable generation
identity, graph/retrieval fingerprints, embedding contract, degradation state,
estimated token total, results, selection decisions, and diagnostics. Each
result preserves the complete unit, citations and exact locators, channel raw
scores for explanation, channel ranks, RRF contributions, exact-match boost,
graph path/relationship IDs, graph penalty, and budget disposition.

Raw full-text and cosine values are never added together. RRF uses ranks with
deterministic stable-ID ties. Graph-expanded results are visibly distinct from
direct lexical/vector hits. A claim is either included intact or skipped.

## Evaluation

```bash
pnpm retrieval:evaluate
pnpm retrieval:benchmark
```

The draft `evaluation/retrieval-golden.yaml` benchmark has 46 cases and a
holdout. The command evaluates all four modes without an LLM judge. Fake-adapter
results prove deterministic plumbing and regression behavior only. Real
provider evaluation is a distinct evidence class and must be cost-bounded and
run only with an approved secret and data classification.

The benchmark command performs warm-up plus repeated measurements and reports
database size, row/embedding inventory, provider query-embedding latency,
lexical/vector/hybrid PostgreSQL p50/p95, graph expansion, and end-to-end
hybrid-graph p50/p95. Timings are informational and have no flaky correctness
threshold. Fake-provider timing and separately authorized external-provider
latency remain distinct evidence classes.

## Diagnostics and troubleshooting

- `RETRIEVAL_DATABASE_UNAVAILABLE`: start Compose and verify the database URL.
- `RETRIEVAL_GENERATION_MISSING`: migrate and index a complete snapshot.
- `RETRIEVAL_INDEX_NOT_CURRENT`: regenerate/check units, then rebuild the DB
  generation with the configured provider contract.
- `RETRIEVAL_EMBEDDING_AUTH`: provide a valid key; authentication is not
  retried.
- `RETRIEVAL_EMBEDDING_DIMENSION` or `NONFINITE`: provider output violated the
  pinned contract.
- `RETRIEVAL_DATA_CLASSIFICATION_DENIED`: the selected provider is not allowed
  to receive this content class.
- `RETRIEVAL_QUERY_EMPTY`: no governed unit matched; no related concept is
  fabricated.

No query content or provider payload is persisted or logged by default. Keys
are environment-only. Future non-public knowledge requires an explicitly
approved private/local provider. See ADR 0006 for decisions and limits.

## M6 boundary

The packet is a candidate context input for a future system. M5 performs no
prompt orchestration, generative answer, recommendation, citation prose,
decision generation, memory, or corpus mutation. M6 has not started.
