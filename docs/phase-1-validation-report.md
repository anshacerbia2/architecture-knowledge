# Phase 1 Validation Report

Date: 2026-07-28

Status: bootstrap validation result; not a human review or approval.

## Environment

Validation used the already-installed Python 3.13.3, PyYAML 6.0.3, jsonschema
4.21.1, and the `referencing` package. No dependencies were downloaded and no
validator was committed because validator implementation belongs to Phase 2.

## Results

An ephemeral read-only bootstrap script checked:

- 14 YAML files parsed successfully;
- 8 JSON Schemas parsed and passed Draft 2020-12 metaschema checks;
- the empty source registry validated against its schema with local references;
- 7 controlled-vocabulary pairs matched between ontology and schemas:
  assignable concept types, predicates, lifecycle states, domains, dimensions,
  claim types, and source statuses;
- no duplicate keys existed in the checked controlled registries;
- local links in 19 Markdown files resolved;
- all kernel registry top-level statuses were `proposed`.

A second in-memory schema exercise checked all six governed record contracts:
knowledge unit, source, claim, relationship, quality-attribute scenario, and
decision guide.

- 6 representative valid fixtures were accepted;
- 9 targeted invalid fixtures were rejected;
- rejected cases covered abstract primary type assignment, a review timestamp
  before human review, an unconditioned recommendation, an unconditioned
  quality impact, a relationship without evidence, incorrect symmetric-edge
  direction, supersession without a replacement, a scenario without a metric,
  and a decision guide with only one option.

Overall bootstrap result: PASS.

## Checks deferred to Phase 2

No committed or CI-executable validators exist yet. Cross-file referential
integrity, ID allocation under concurrency, Markdown front-matter extraction,
required-section content checks, relationship endpoint concept-type checks,
lifecycle transition event audit, orphan and cycle detection, suspicious
source-like prose detection, and generated graph/index validation remain
unimplemented.
