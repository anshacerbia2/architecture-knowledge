# ADR 0001 — Phase 2 Validation Toolchain

Status: proposed implementation decision  
Date: 2026-07-29

This record is not human-reviewed, approved, published, or canonical.

## Context

M1 relied on ephemeral Python bootstrap scripts and globally installed
packages. M2 requires deterministic validation from a clean checkout with
precise diagnostics, negative fixtures, CI, and generated integrity reports.

## Decision

Use:

- Node.js 24.11.1;
- pnpm 10.23.0 with a committed frozen lockfile;
- TypeScript 5.9.3 executed by tsx 4.20.6;
- AJV 8.17.1 plus ajv-formats 3.0.1 for JSON Schema Draft 2020-12;
- yaml 2.8.1 with duplicate keys rejected and scalar coercion disabled;
- Vitest 4.0.16 for behavior and regression tests;
- Prettier 3.8.1 for deterministic formatting.

Versions are exact. Runtime and package-manager versions are declared in
`package.json`, `.nvmrc`, and the `packageManager` field.

## Trade-offs

AJV provides mature schema compilation and detailed instance paths, but
cross-record semantics still require TypeScript validators. TypeScript adds a
build-time check and one runtime ecosystem, but its type system cannot prove
external YAML validity. Vitest adds a dependency but materially improves
negative and edge-case assertions.

No ESLint configuration is added. Strict TypeScript plus Prettier covers the
current small validation kernel without overlapping configuration. Reconsider
linting if runtime rules grow beyond compiler coverage.

Python remains useful for ad hoc analysis but is no longer part of the
reproducible validation boundary.
