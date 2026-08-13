# ADR 0007 — Governed Architecture RAG

Status: proposed implementation decision
Date: 2026-08-13

This record is machine-authored. It is not human-reviewed, approved, published,
or canonical. It does not change any knowledge lifecycle state.

## Context

M5 returns bounded, traceable retrieval packets but deliberately does not
generate answers. M6 must make those packets usable for architecture questions
without turning a model into a new source of truth, allowing fabricated
citations, hiding inference as fact, or starting the M7 decision-assistant
scope.

## Decision

Use a staged, fail-closed pipeline:

```text
validated question and project context
→ current M5 hybrid-graph retrieval
→ immutable governed context packet
→ structured model output
→ deterministic post-generation grounding validation
→ answer packet and Markdown rendering
```

The context packet contains only M5-selected evidence, a local evidence ID for
each item, a citation catalog, graph-path provenance, project context, token
estimate, retrieval generation identity, and a SHA-256 fingerprint. Model
output may refer only to the supplied evidence IDs and governed claim IDs.
Citation metadata is resolved by application code from the catalog; the model
cannot author URLs, source IDs, titles, or locators.

## Epistemic contract

Every answer statement has exactly one visible epistemic type:

- `sourced-claim`: directly cites at least one first-class claim unit and names
  only claim IDs present in that evidence;
- `synthesis`: combines at least two evidence items;
- `inference`: a derived conclusion, never represented as high confidence;
- `recommendation`: allowed only by an explicit request with non-empty project
  context, and requires conditions, alternatives, and trade-offs;
- `uncertainty`: non-assertive and low-confidence.

Every assertive statement requires evidence and at least one resolvable source
citation. A model refusal is returned as `refused`; empty retrieval is returned
without calling a model as `insufficient-evidence`. Malformed output, dangling
evidence or claims, missing citations, incomplete recommendation framing, or
excessive derived confidence fails the request with stable diagnostics.

These checks establish structural grounding and citation integrity. They do
not prove that arbitrary generated prose is semantically entailed by its
citations. Real-provider semantic entailment and answer quality require a
separate human or governed-evaluator evidence class.

## Model and output contract

The production adapter uses the OpenAI Responses API with exact model
`gpt-5.6`, `store: false`, bounded output, timeout, retry, and data-classification
controls. It uses strict Structured Outputs through `text.format` with a JSON
Schema. The official
[Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs)
defines the Responses API `text.format` contract and requires closed object
schemas; the runtime schema therefore declares every property required and
sets `additionalProperties: false` on every object.

The adapter handles refusal and incomplete responses explicitly, verifies the
returned model, parses the JSON payload, and then applies a stricter
application-level contract. Only timeouts, network failures, HTTP 408/409/429,
and 5xx responses are retried. Credentials are environment-only and provider
payloads are not logged or persisted by this implementation.

A deterministic fake model copies only directly cited claim text. It supports
secret-free CI and functional evaluation but is not evidence of generative
semantic quality.

## Evaluation

The draft M6 benchmark contains exact-claim, natural-language, filtered
no-answer, and adversarial cases. It measures answer-status accuracy, expected
claim recall, citation completeness and resolvability, epistemic-label
completeness, unsupported statements, and prohibited output. Safety metrics
must be perfect; expected-claim recall must be at least 0.8.

The committed evaluation is intentionally deterministic. A future authorized
real-provider run must report its provider/model/prompt version and remain a
separate evidence class.

## Rejected alternatives

- Free-form model prose followed by citation extraction: citations could not
  be proven to originate in retrieved evidence.
- Model-authored URLs or source metadata: this creates a hallucination path and
  duplicates the governed catalog.
- Treating all output as sourced fact: synthesis, inference, recommendations,
  and uncertainty have different epistemic obligations.
- Silent answer generation after stale or empty retrieval: this breaks the M5
  currentness and no-fabrication contracts.
- Allowing recommendations without project context: this starts M7-like
  decision behavior without the necessary constraints.
- Persisting model responses by default: unnecessary for the MVP and expands
  privacy and retention risk.

## M7 boundary

M6 answers bounded questions and can render explicitly requested,
context-qualified recommendations. It does not extract architectural drivers,
generate candidate option sets, approve decisions, draft ADR/RFC/PAD artifacts,
create memory, alter knowledge, or cross a human lifecycle boundary. Those
capabilities remain M7 or later.

