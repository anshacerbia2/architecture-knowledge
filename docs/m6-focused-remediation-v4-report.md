# M6 Focused Remediation V4 Report

Date: 2026-08-31

Audited baseline: `827afde7f135387b1f10dc7faef3d4ec7eaea9fd`

Audit evidence commit: `c31013b`

Branch: `m6-focused-remediation-v4`

This machine-authored report records focused implementation and validation for
M6-AUD-009 from
[`m6-final-independent-reaudit-v3-report.md`](m6-final-independent-reaudit-v3-report.md).
It is not an independent re-audit, human approval, lifecycle transition, M6
clearance, or permission to begin M7. No governed knowledge, claim,
relationship, source, ontology, or lifecycle record changed.

## Finding disposition

| Finding | Remediation disposition | Implementation evidence |
|---|---|---|
| M6-AUD-009 - forgeable evaluator evidence classification | Implemented; requires exact-SHA hosted evidence and independent verification | The public `contract_registry_version` provenance marker was removed. Only successful loading of the repository-registered benchmark and contract paths creates a module-private `WeakMap` attestation. The attestation binds the exact object identity to a SHA-256 fingerprint of its version, status, cases, and embedded contracts. The evaluator fingerprints and validates an isolated snapshot before provider invocation and uses that snapshot throughout the run. |

The original M6-AUD-004 category exploit remains covered by the V3 contract
registry and regressions. Findings already closed, accepted, or deferred by the
V3 re-audit were not reopened. M7 behavior remains excluded.

## Security and architecture decisions

- Governed provenance is capability-like runtime state, not a caller-supplied
  data property. The attestation map and fingerprint function are not exported.
- Attestation requires both registered repository artifact paths. A valid copy,
  or a registered benchmark paired with an unregistered contract copy (and the
  reverse), remains synthetic evidence.
- The fingerprint covers the full parsed benchmark envelope, every case field,
  and every attached contract. Evaluation clones first, validates the snapshot
  against the attested fingerprint, and then reads only that snapshot. Mutation
  before the call fails closed; mutation from a provider callback cannot change
  later cases, scoring, or reported benchmark identity.
- Structural equality does not transfer authority. Cloning or reconstructing a
  validated object produces an unattested object and a synthetic evidence class.
- Programmatic fixtures remain supported for unit and adversarial testing, but
  passing all metric gates cannot promote their evidence classification.
- Both evaluation artifacts remain `draft`; this run creates no reviewed,
  approved, published, or canonical content.

## Regression proof

The focused test reproduces the independent exploit: it constructs version
`999`, status `synthetic-programmatic`, copies all eight valid embedded safety
contracts, replaces the 15 ordinary questions, supplies the former public
marker, and produces a report that passes every metric gate. The report is
nevertheless labeled `synthetic ungoverned evaluator fixture` and never
`contract-registry-validated`.

Additional regressions prove that:

- the committed registered artifact pair receives governed classification only
  after loader validation;
- a valid artifact copy and both mixed registered/unregistered path pairs remain
  synthetic;
- mutation of a bound contract, contract removal, benchmark version, status, or
  an ordinary question fails the integrity check before provider invocation;
- benchmark mutation during a provider callback cannot alter the 23 evaluated
  cases, gate result, version, or status; and
- the public benchmark value contains no provenance marker to copy.

## Validation evidence

| Gate | Result |
|---|---|
| Typecheck | Passed |
| Focused evaluator tests | Passed: 24/24 |
| Full repository validation | Passed: schema, vocabulary, IDs, sources, claims, relationships, lifecycle, Markdown, and links; 0 errors, 0 warnings |
| Full test suite | Passed: 440; 4 conditional local PostgreSQL tests skipped |
| Coverage | Passed: 92.11% statements, 82.67% branches, 95.61% functions, and 94.70% lines; `rag-evaluation.ts` reached 90.83% statements and 87.17% branches |
| Focused RAG mutation | Passed: 75.46% total and 76.48% covered; 903 killed, 278 survived, 16 no coverage, 1 timeout, and 0 errors. `rag-evaluation.ts` reached 71.95% with 313 killed and 122 survived. |
| Deterministic integrity currentness | Passed: 12/12 reports current after documentation regeneration |

Local PostgreSQL evidence is outside the implementation logic changed here.
The final exact-SHA hosted workflow must still execute the active pgvector and
RAG evaluation boundary; no unavailable local database command will be
represented as passing.

## Residual risks and re-audit boundary

- A process with write authority over the registered repository artifacts or
  executable source is outside this in-process provenance boundary and must be
  controlled by Git review and exact-SHA CI evidence.
- The contract registry remains a visible policy artifact; coordinated policy
  changes require reviewer scrutiny even though they cannot forge runtime
  provenance through the reusable evaluator API.
- Deterministic-provider results remain functional and adversarial-outcome
  evidence, not real-provider semantic-quality evidence.
- The committed holdout remains public regression evidence, not a secret or
  independently administered holdout.

M6 remains not cleared by this report. M7 entry requires a green exact-SHA
hosted workflow and an independent re-audit that directly retries M6-AUD-009
through programmatic construction, object cloning, copied/mixed artifact paths,
and post-load mutation, then explicitly records the M6/M7 decision.
