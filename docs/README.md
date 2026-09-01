# Documentation Reading Order

This directory contains historical assessments, implementation reports,
independent audits, remediation evidence, and architecture decision records.
The filenames are intentionally stable because renaming an audit artifact can
break links and obscure provenance.

Use the logical reading order below to follow the project story. Sequence labels
in this index are navigational only; they do not change lifecycle status or make
any document reviewed, approved, published, or canonical.

## Recommended Reading Path

### Foundation and validation kernel

| Sequence | Document | Why it comes here |
|---|---|---|
| M0-01 | [Phase 0 Repository Assessment](phase-0-assessment.md) | Records the empty starting state, scope resolution, and initial taxonomy challenge. |
| M1-01 | [Kernel Decisions](kernel-decisions.md) | Defines the foundational taxonomy, ontology, identifiers, evidence, lifecycle, and repository decisions. |
| M1-02 | [Ontology Stress Test](ontology-stress-test.md) | Challenges the kernel against mixed abstraction levels and cross-domain relationships. |
| M1-03 | [Phase 1 Validation Report](phase-1-validation-report.md) | Records bootstrap validation and the boundary deferred to Phase 2. |
| M2-01 | [ADR 0001: Validation Toolchain](adr/0001-validation-toolchain.md) | Explains the committed pnpm and TypeScript validation toolchain. |
| M2-02 | [ADR 0002: Canonical ID Allocation](adr/0002-canonical-id-allocation.md) | Explains immutable allocation and identifier-governance choices. |
| M2-03 | [Phase 2 Validation Kernel Report](phase-2-validation-report.md) | Records the executable validators, tests, reports, and CI boundary. |

### M3 reference corpus and hardening

| Sequence | Document | Why it comes here |
|---|---|---|
| M3-01 | [M3 Source Admission Proposal](m3-source-admission-proposal.md) | Establishes which sources may support claims and the boundaries of that admission. |
| M3-02 | [M3 Validation Report](m3-validation-report.md) | Records the initial reference corpus and its structural validation. |
| M3-03 | [M3 Independent Semantic and Content Audit](m3-semantic-audit-report.md) | Independently identifies the first semantic, evidence, taxonomy, and retrieval-safety findings. |
| M3-04 | [M3 Semantic Remediation Report](m3-semantic-remediation-report.md) | Disposes M3-AUD-001 through M3-AUD-016. Read with [ADR 0003](adr/0003-m3-semantic-model-remediation.md). |
| M3-05 | [M3 Independent Semantic Re-audit](m3-independent-semantic-reaudit-report.md) | Tests the remediation and finds the remaining security and relationship-scope blockers. |
| M3-06 | [M3 Focused Retrieval-Safety Hardening Report](m3-focused-hardening-report.md) | Hardens normative security claims and relationship evidence transfer. |
| M3-07 | [Final Focused M3 Independent Re-Audit](m3-final-focused-reaudit-report.md) | Re-audits the focused hardening and identifies the remaining security-validator defects. |
| M3-08 | [M3 Final Security Remediation Report](m3-final-security-remediation-report.md) | Remediates those final security findings. Read with [ADR 0004](adr/0004-security-claim-applicability-and-projection.md). |
| M3-09 | [M3-REG-001 Focused Remediation Report](m3-reg-001-remediation-report.md) | Closes the metadata-driven normative-claim classification bypass found by the following regression audit. |
| M3-10 | [Final M3 Regression Re-Audit](m3-final-regression-reaudit-report.md) | Independently verifies M3-REG-001 closure and records the final `M4 READY` verdict. |

### M4 knowledge graph and query layer

| Sequence | Document | Why it comes here |
|---|---|---|
| M4-01 | [ADR 0005: Knowledge Graph Projection and Traversal](adr/0005-knowledge-graph-projection-and-traversal.md) | Defines the derived-graph boundary, default-deny traversal, determinism contract, and rejected infrastructure alternatives. |
| M4-02 | [M4 Graph and Query Layer](m4-graph-query-layer.md) | Documents artifacts, commands, exact-query behavior, diagnostics, and the M5 boundary. |
| M4-03 | [M4 Implementation Report](m4-implementation-report.md) | Reconciles relationship counts and records implementation, validation, determinism, CI, and handoff evidence. |
| M4-04 | [Independent M4 Audit](m4-independent-audit-report.md) | Adversarially verifies projection, traversal, provenance, query integrity, determinism, currentness, mutation residuals, and the `M5 READY` exit decision. |

### M5 hybrid retrieval

| Sequence | Document | Why it comes here |
|---|---|---|
| M5-01 | [ADR 0006: Hybrid Retrieval Architecture](adr/0006-hybrid-retrieval-architecture.md) | Defines the PostgreSQL/pgvector, embedding, fusion, generation, graph-expansion, privacy, and M6 boundaries. |
| M5-02 | [M5 Hybrid Search and Retrieval](m5-hybrid-retrieval.md) | Documents setup, indexing, query/result contracts, evaluation, diagnostics, and safety behavior. |
| M5-03 | [M5 Implementation Report](m5-implementation-report.md) | Records implementation inventory, validation, quality, performance, hosted provenance, residuals, and audit handoff. |
| M5-04 | [Independent M5 Audit](m5-independent-audit-report.md) | Verifies the local deterministic boundary and records three environment evidence gaps with an `M5 AUDIT INCONCLUSIVE` verdict. |
| M5-05 | [M5 Focused Audit Evidence Closure](m5-focused-evidence-closure.md) | Preserves authenticated exact-SHA CI, PostgreSQL/pgvector, evaluation, performance, and mutation evidence for independent finding closure. |
| M5-06 | [M5 Focused Evidence Re-Audit](m5-focused-evidence-reaudit-report.md) | Independently closes or accepts the three scoped evidence findings and records the final `M6 READY` entry decision. |

### M6 architecture RAG

| Sequence | Document | Why it comes here |
|---|---|---|
| M6-01 | [ADR 0007: Governed Architecture RAG](adr/0007-governed-architecture-rag.md) | Defines the context, epistemic, structured-output, citation, provider, failure, and M7 boundaries. |
| M6-02 | [M6 Architecture RAG](m6-architecture-rag.md) | Documents setup, request and answer contracts, commands, safety behavior, evaluation, and limitations. |
| M6-03 | [M6 Implementation Report](m6-implementation-report.md) | Records implementation inventory, local validation, residual risks, and the independent-audit handoff. |
| M6-04 | [Independent M6 Audit](m6-independent-audit-report.md) | Records the exact-SHA audit, four M7 blockers, lower-severity findings, and the `M6 NOT READY` decision. |
| M6-05 | [M6 Focused Remediation](m6-focused-remediation-report.md) | Disposes M6-AUD-001 through M6-AUD-008 and records the validation and re-audit boundary. |
| M6-06 | [M6 Focused Independent Re-Audit](m6-focused-independent-reaudit-report.md) | Independently closes three blockers, accepts or defers the bounded residuals, and reproduces the remaining citation-authority and benchmark-gaming blockers. |
| M6-07 | [M6 Focused Remediation V2](m6-focused-remediation-v2-report.md) | Replaces retriever-trusted citation resolution with governed authority and replaces benchmark-phrase refusal logic with adversarial-outcome evaluation. |
| M6-08 | [Final Independent M6 Re-Audit](m6-final-independent-reaudit-report.md) | Independently closes citation authority, reproduces the category-metadata benchmark bypass, and retains the `M6 NOT READY` decision. |
| M6-09 | [M6 Focused Remediation V3](m6-focused-remediation-v3-report.md) | Binds safety cases to a separate versioned contract registry and records the exact bypass regression and validation handoff. |
| M6-10 | [Final Independent M6 V3 Re-Audit](m6-final-independent-reaudit-v3-report.md) | Closes the original category exploit, identifies the forgeable evidence-class marker as M6-AUD-009, and retains the `M6 NOT READY` decision. |
| M6-11 | [M6 Focused Remediation V4](m6-focused-remediation-v4-report.md) | Replaces caller-controlled provenance with private artifact-pair and content-integrity attestation, then records the re-audit handoff. |
| M6-12 | [Final Independent M6 V4 Re-Audit](m6-final-independent-reaudit-v4-report.md) | Independently closes M6-AUD-009, records `M6 READY`, and preserves the explicit-human-authorization boundary for M7. |

### M7 architecture decision assistant

| Sequence | Document | Why it comes here |
|---|---|---|
| M7-01 | [M7.0 Entry Alignment and Decision Model Audit](m7-entry-alignment-decision-model-audit.md) | Aligns the M6 exit, separates reusable guides from sessions and draft decisions, stress-tests the bootstrap model, and defines the preconditions for a separately authorized M7.1 kernel run. |

## Architecture Decision Records

ADRs are supporting decision artifacts rather than a separate execution
timeline. Read each ADR alongside the phase or remediation that introduced the
decision.

| ADR | Related flow |
|---|---|
| [0001: Validation Toolchain](adr/0001-validation-toolchain.md) | M2-01 through M2-03 |
| [0002: Canonical ID Allocation](adr/0002-canonical-id-allocation.md) | M1 identifier design and M2 enforcement |
| [0003: M3 Semantic Model Remediation](adr/0003-m3-semantic-model-remediation.md) | M3-04 through M3-06 |
| [0004: Security Claim Applicability and Projection](adr/0004-security-claim-applicability-and-projection.md) | M3-07 through M3-09 |
| [0005: Knowledge Graph Projection and Traversal](adr/0005-knowledge-graph-projection-and-traversal.md) | M4-01 through M4-04 |
| [0006: Hybrid Retrieval Architecture](adr/0006-hybrid-retrieval-architecture.md) | M5-01 through M5-03 |
| [0007: Governed Architecture RAG](adr/0007-governed-architecture-rag.md) | M6-01 through M6-12 |

## Git Creation Timeline

This table records when each artifact first appeared in Git. It is deliberately
separate from the logical reading path: several documents were authored during
different review steps but first committed together with the remediation they
describe.

| First Git appearance (Asia/Jakarta) | Commit | Documents first added |
|---|---|---|
| 2026-07-29 01:53 | `9299075` | Phase 0 assessment; kernel decisions; ontology stress test; Phase 1 report; Phase 2 report; ADR 0001; ADR 0002 |
| 2026-07-29 17:37 | `fbc0eb2` | M3 source-admission proposal; M3 validation report |
| 2026-07-31 01:08 | `5041208` | M3 semantic audit; semantic remediation; independent semantic re-audit; ADR 0003 |
| 2026-07-31 01:40 | `0fe30be` | M3 focused hardening report |
| 2026-08-02 02:28 | `4844c2a` | Final focused M3 re-audit; ADR 0004 |
| 2026-08-02 03:09 | `af08022` | M3 final security remediation report |
| 2026-08-02 05:37 | `be21bac` | M3-REG-001 remediation report |
| 2026-08-02 17:32 | `aa23532` | Final M3 regression re-audit report |
| 2026-08-02 22:29 | `0bdc241` | ADR 0005; M4 graph/query guide |
| 2026-08-03 | report commit; see post-commit handoff | M4 implementation report |
| 2026-08-03 | audit-report commit; see post-commit handoff | Independent M4 audit report |
| 2026-08-10 | `9b36aa6` | ADR 0006; M5 hybrid-retrieval guide; M5 implementation report |
| 2026-08-10 | `d2a9a57` | Independent M5 audit report |
| 2026-08-10 | `f77e089` | M5 focused audit evidence closure and hosted-run export |
| 2026-08-13 | audit-exit commit; see post-commit handoff | M5 focused evidence re-audit report |
| 2026-08-13 | implementation commit; see post-commit handoff | ADR 0007; M6 architecture RAG guide; M6 implementation report |
| 2026-08-22 | `adcf535` | Independent M6 audit report |
| 2026-08-22 | remediation commit; see post-commit handoff | M6 focused remediation report |
| 2026-08-23 | `75c7527` | M6 focused independent re-audit report |
| 2026-08-23 | remediation-v2 commit; see post-commit handoff | M6 focused remediation v2 report |
| 2026-08-28 | `03932d7` | Final independent M6 re-audit report |
| 2026-08-28 | implementation commit; see post-commit handoff | M6 focused remediation v3 report |
| 2026-08-31 | `c31013b` | Final independent M6 V3 re-audit report |
| 2026-08-31 | implementation commit; see post-commit handoff | M6 focused remediation v4 report |
| 2026-09-01 | `ca9dc44` | Final independent M6 V4 re-audit report |
| 2026-09-01 | entry-audit commit; see post-commit handoff | M7.0 entry alignment and decision-model audit |

## Maintenance Rule

- Keep historical filenames stable.
- Add each new audit or remediation to both the logical path and Git timeline.
- Use the next navigational sequence label without encoding that label into the
  governed artifact's identity.
- Treat Git history as creation provenance and this index as reading guidance;
  neither substitutes for lifecycle authority.
