# M6 Architecture RAG

M6 turns a current M5 evidence packet into a structurally grounded architecture
answer. Repository records and admitted sources remain authoritative. The model
is an answer composer, not a source or lifecycle authority.

## Local setup

Start and index the M5 retrieval database first:

```bash
pnpm install --frozen-lockfile
pnpm graph:check
pnpm retrieval:units:check
pnpm retrieval:db:up
pnpm retrieval:migrate
pnpm retrieval:index
pnpm retrieval:check
```

The default `RAG_MODEL_PROVIDER=fake` is deterministic and requires no secret.
It proves orchestration, grounding, citations, and failure behavior, not
real-model semantic quality. Production execution requires
`RAG_MODEL_PROVIDER=openai`, an authorized `OPENAI_API_KEY`, and an allowed
`RAG_EXTERNAL_ALLOWED_CLASSIFICATIONS` value.

## Commands

```bash
pnpm rag:context -- "What issuer check is required for an OpenID Connect ID Token?"
pnpm rag:answer -- "What issuer check is required for an OpenID Connect ID Token?"
pnpm rag:answer -- "What issuer check is required for an OpenID Connect ID Token?" --json
pnpm rag -- answer --file rag-request.json --json
pnpm rag:evaluate
pnpm test:mutation:rag
```

`rag:context` shows the exact evidence and citation catalog that would cross the
model boundary. `rag:answer` returns Markdown by default or the complete answer
packet with `--json`. `rag:evaluate` requires a migrated, indexed, current M5
database.

## Request contract

The smallest structured request contains a question and
`data_classification`. The CLI injects the runtime classification from
`RETRIEVAL_DATA_CLASSIFICATION` (default `public`) and rejects a conflicting
file value. Defaults select bounded `hybrid-graph`
retrieval with graph depth 1 and disable recommendations. Structured file input
can add project context, retrieval filters/budgets, and answer bounds:

```json
{
  "question": "Which approach fits this payment workflow?",
  "data_classification": "internal",
  "project_context": {
    "system_description": "Regional payment processing service",
    "constraints": ["at-least-once delivery", "PCI scope"],
    "quality_priorities": ["recoverability", "consistency"]
  },
  "retrieval": {
    "mode": "hybrid-graph",
    "top_k": 10,
    "candidate_k": 40,
    "filters": {},
    "graph": { "enabled": true, "max_depth": 1, "predicates": [] },
    "budget": {
      "max_units": 10,
      "max_estimated_tokens": 4000,
      "max_units_per_concept": 3
    },
    "explain": true,
    "allow_degraded_lexical_fallback": false
  },
  "answer": {
    "allow_recommendations": true,
    "max_statements": 8,
    "max_output_tokens": 1800
  }
}
```

The retrieval text is always derived from the normalized question and cannot be
overridden. Recommendation permission requires non-empty system description,
constraints, or quality priorities. Unknown fields, wrong types, excessive
text/list sizes, and out-of-range limits fail with `RAG_REQUEST_SHAPE`.

## Answer contract

An answer packet preserves:

- status: `answered`, `insufficient-evidence`, or `refused`;
- whether the model was invoked;
- provider, exact model, prompt and contract versions;
- context fingerprint and M5 generation/graph/manifest provenance;
- statements labeled `sourced-claim`, `synthesis`, `inference`,
  `recommendation`, or `uncertainty`;
- application-resolved source citations and locators;
- uncertainties, diagnostics, and the original retrieval packet;
- deterministic Markdown rendering.

The model receives local evidence IDs such as `E0001`. It does not receive
permission to invent citation IDs or URLs. Application code resolves each
`record_id` and `source_id` pair through the current validated graph. Only an
`approved` registered source authorized for that record can enter the context
catalog. The final title and HTTPS URL come from the governed source registry,
not retriever-supplied citation metadata.

## Fail-closed behavior

- stale or missing M5 generation: retrieval startup fails;
- empty retrieval: `insufficient-evidence`, model is not called;
- provider refusal: explicit `refused` packet;
- provider timeout/exhaustion, malformed output, or model mismatch: stable
  provider error;
- dangling evidence or claim, unsupported assertion, or blank, malformed,
  unregistered, non-admitted, or record-unauthorized source:
  `RAG_GROUNDING_INVALID`;
- synthesis with fewer than two evidence items: rejected;
- inference/recommendation marked high confidence: rejected;
- unrequested or incompletely framed recommendation: rejected;
- disallowed data classification: rejected before provider invocation.

## Evaluation and limitations

`evaluation/rag-golden.yaml` is a draft version-3, 23-case functional benchmark.
Its two natural no-answer and six adversarial cases are bound to the separate
draft registry `evaluation/rag-case-contracts.yaml`. Stable case IDs, SHA-256
question fingerprints, required categories, and exact status, invocation,
claim, epistemic, prohibited-output, and holdout obligations prevent a category
relabel from disabling their safety contract. The evaluator rechecks the bound
contract immediately before provider invocation and scores against that
contract rather than mutable category metadata. Governed evidence classification
is issued only to the registered benchmark and contract artifact pair after the
loader validates both. A module-private attestation binds the complete parsed
benchmark fingerprint to that exact object. Evaluation verifies an isolated
snapshot, then uses that snapshot for every request and reported benchmark
field. Programmatic objects, copied files, mixed artifact pairs, and post-load
or mid-run mutations therefore cannot obtain, retain, or alter governed
evidence. Changes to this versioned registry are
explicit evaluation-policy migrations; its status does not confer review or
canonicality.

Exact-ID questions are detected from question text and capped at 25%; no-answer
cases use natural queries without impossible filters; all six adversarial cases
must reach the model boundary; and the committed holdout is scored separately.
An adversarial case may produce a safely grounded answer or an explicit refusal,
but may not execute the requested effect, emit prohibited text, or introduce a
forbidden claim. The deterministic provider has no benchmark-phrase refusal
classifier: it copies only governed evidence, so paraphrasing an instruction
cannot unlock a separate behavior path. Gates cover status, model invocation,
expected and forbidden claims, citations, epistemic types, unsupported output,
and prohibited text. The committed holdout is a regression partition, not a
secret independent benchmark. The corpus is not human-reviewed architecture
knowledge and does not establish real-provider semantic quality.

Post-generation validation proves structural support: cited IDs exist, source
metadata resolves, and epistemic obligations are met. It cannot prove textual
entailment between every generated sentence and the cited material. Users must
therefore inspect citations for high-impact decisions, and a real-provider
semantic audit is required before production claims.

## M7 boundary

The CLI does not create decision records, ADRs, recommendations without explicit
context, memory, feedback loops, or repository mutations. M7 remains unopened
until M6 receives an independent audit and explicit entry decision.
