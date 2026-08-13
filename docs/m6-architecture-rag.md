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

The smallest request is a question. Defaults select bounded `hybrid-graph`
retrieval with graph depth 1 and disable recommendations. Structured file input
can add project context, retrieval filters/budgets, and answer bounds:

```json
{
  "question": "Which approach fits this payment workflow?",
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
- provider, exact model, prompt and contract versions;
- context fingerprint and M5 generation/graph/manifest provenance;
- statements labeled `sourced-claim`, `synthesis`, `inference`,
  `recommendation`, or `uncertainty`;
- application-resolved source citations and locators;
- uncertainties, diagnostics, and the original retrieval packet;
- deterministic Markdown rendering.

The model receives local evidence IDs such as `E0001`. It does not receive
permission to invent citation IDs or URLs. Application code resolves citations
from the context catalog only after grounding checks pass.

## Fail-closed behavior

- stale or missing M5 generation: retrieval startup fails;
- empty retrieval: `insufficient-evidence`, model is not called;
- provider refusal: explicit `refused` packet;
- provider timeout/exhaustion, malformed output, or model mismatch: stable
  provider error;
- dangling evidence or claim, unsupported assertion, or missing source:
  `RAG_GROUNDING_INVALID`;
- synthesis with fewer than two evidence items: rejected;
- inference/recommendation marked high confidence: rejected;
- unrequested or incompletely framed recommendation: rejected;
- disallowed data classification: rejected before provider invocation.

## Evaluation and limitations

`evaluation/rag-golden.yaml` is a draft 15-case functional benchmark. The fake
provider gates exact claim recall and perfect citation/safety behavior. It is
not human-reviewed architecture knowledge and does not establish real-provider
semantic quality.

Post-generation validation proves structural support: cited IDs exist, source
metadata resolves, and epistemic obligations are met. It cannot prove textual
entailment between every generated sentence and the cited material. Users must
therefore inspect citations for high-impact decisions, and a real-provider
semantic audit is required before production claims.

## M7 boundary

The CLI does not create decision records, ADRs, recommendations without explicit
context, memory, feedback loops, or repository mutations. M7 remains unopened
until M6 receives an independent audit and explicit entry decision.

