# Knowledge Authoring Instructions

This directory will hold domain-organized knowledge units after M2
validation is operational. Do not add substantive units during the kernel
phase.

Each future unit must:

- have one assignable primary concept type and justified secondary types;
- use domain and dimension facets independently of type;
- conform to `schemas/knowledge-unit.schema.json`;
- contain every required Markdown section, or an explicit reason a section is
  not applicable;
- connect significant prose to first-class claims and registered sources;
- describe applicability, non-applicability, forces, trade-offs, alternatives,
  failure modes, and quality-attribute effects;
- assess security, data, and operational implications;
- remain below `reviewed` until an authorized human acts.

Required Markdown sections:

```text
# Title
## Summary
## Intent
## Context
## Problem
## Forces
## How It Works
## Structural View
## Runtime View
## Applicability
## When Not to Use It
## Quality Attribute Impact
## Benefits
## Trade-offs
## Risks and Failure Modes
## Security Implications
## Data Implications
## Operational Implications
## Implementation Variants
## Alternatives
## Decision Guide
## Verification and Testing
## Examples
## Counterexamples
## Related Concepts
## Claims and Evidence
## Sources
```
