# M7.1 Decision Guide Validation Kernel Implementation Report

## Executive summary

M7.1 implements the authorized validation kernel: schema migration, semantic gate, evidence and
applicability rules, complete trade-off matrices, first-class graph and retrieval support, separate
session/recommendation/draft contracts, privacy and human-authority boundaries, and focused quality
gates.

It does not create a decision-guide corpus, assistant runtime, model integration, or artifact
generator. No record is marked reviewed, approved, published, or canonical. Validation success is
not human approval.

## Authorization and governance interpretation

Ansha Cerbia approved M7.0 completion and authorized M7.1 on 2026-09-02. The repository did not need
that statement because governance universally requires approval before code changes. It was needed
because the independently recorded M6 exit and the M7.0 audit deliberately made the next milestone a
separately authorized scope boundary. The actual lifecycle rule requiring explicit human authority
applies to `human-review -> reviewed` and `reviewed -> published`. M7.1 performs neither transition.

## Implemented scope

- decision-guide schema v2 and registry migration;
- dedicated `decision-guides` kernel category and CLI command;
- evidence inventory, transitive grounding, applicability, condition-transfer, reference/type,
  matrix, option, and privacy validation;
- separate ephemeral session, evidence-bearing recommendation-only, and draft-only contracts,
  including scoped external-provider authorization;
- graph v2 decision-guide index, node, provenance, querying, validation, and deterministic
  currentness;
- retrieval v2 guide overview/section units, citations, filtering, and database migration;
- positive, negative, boundary, regression, coverage, focused mutation, and Linux/Windows CI wiring.

## Scope exclusions

- no `decisions/*.yaml` production guide;
- no session store;
- no assistant orchestration or prompt;
- no model/provider integration;
- no ADR/RFC/PAD renderer or generator;
- no lifecycle event or automated approval.

## Migration disposition

The old decision-guide schema had no instances, so no governed content required migration. The
schema registry moves from v3 to v4. Graph and retrieval contracts move from v1 to v2, and their
generated artifacts are regenerated. PostgreSQL instances apply `0002_decision_guide_retrieval.sql`
after the original retrieval migration.

## Validation evidence

| Gate                             | Result                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm format:check`              | passed                                                                                |
| `pnpm validate`                  | passed; 0 errors and 0 warnings across all ten categories                             |
| `pnpm validate:decision-guides`  | passed; 0 errors and 0 warnings                                                       |
| `pnpm graph:check`               | 13/13 artifacts current                                                               |
| `pnpm retrieval:units:check`     | 2/2 artifacts current                                                                 |
| `pnpm report:check`              | 13/13 reports current                                                                 |
| `pnpm test` / coverage execution | 35 files passed, 1 PostgreSQL file skipped; 454 tests passed, 4 skipped               |
| Coverage                         | 92.44% statements, 82.37% branches, 95.85% functions, 94.99% lines                    |
| Focused decision-guide mutation  | 81.16% total, 82.96% covered; 112 killed, 23 survived, 3 no coverage, 0 timeout/error |
| Focused RAG mutation             | 75.46% total; decision-guide-aware citation authority 100%; threshold passed          |

Local PostgreSQL tests were skipped because no local database was configured. Migration and
cross-platform behavior remain mandatory in the existing hosted Linux/Windows and PostgreSQL
workflow. Exact-SHA hosted evidence must be green before an independent M7.1 exit audit can clear
later corpus work.

The first focused mutation invocation failed before mutation execution because the new config
omitted the explicitly loaded Vitest plugin. The config was aligned with the repository's existing
focused mutation contracts and the unchanged gate then completed above threshold. No threshold or
validator rule was weakened.

## Residual risks and next entry conditions

- The committed production guide count is intentionally zero; only synthetic fixtures exercise
  non-empty behavior.
- Exact semantic entailment between free-form claim text and assessments remains a
  human/content-audit concern beyond structural applicability.
- `human_key` for active guides remains unresolved and must be decided before a sizable guide
  corpus.
- The external-provider policy is a contract only until a separately authorized runtime enforces it.
- A representative corpus and assistant runtime remain blocked until an independent M7.1 audit
  closes implementation findings.
