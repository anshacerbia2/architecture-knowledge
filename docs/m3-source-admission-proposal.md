# M3 Source Admission Proposal

Status: source-admission package approved by Ansha Cerbia on 2026-07-29 for
AKS-000001 through AKS-000022 within the boundaries below. This approval does
not approve a claim, relationship, knowledge unit, recommendation,
architecture decision, or canonical status.

## Purpose

M3 requires twenty reference knowledge units with first-class claims and typed
relationships. The validation kernel forbids candidate sources from supporting
claims, and every `candidate -> approved` source transition is human-only.
This package therefore separates research and quality assessment from the
admission decision.

Approval of a source means only that the source may be used as evidence within
its assessed scope. It does not approve claims derived from it and does not move
content beyond the human-review boundary.

## Proposed source-to-unit coverage

| Reference knowledge unit | Proposed source IDs |
| --- | --- |
| First-Principles Thinking | AKS-000001 |
| Systems Thinking | AKS-000002 |
| Constraint | AKS-000002, AKS-000022 |
| Availability | AKS-000003, AKS-000004, AKS-000005 |
| Reliability | AKS-000003, AKS-000004, AKS-000005 |
| Quality Attribute Scenario | AKS-000004 |
| Modular Monolith | AKS-000006, AKS-000007 |
| Microservices | AKS-000007, AKS-000008 |
| Hexagonal Architecture | AKS-000006, AKS-000009 |
| Event-Driven Architecture | AKS-000010 |
| Idempotency | AKS-000011, AKS-000012 |
| Retry | AKS-000012 |
| Circuit Breaker | AKS-000013 |
| Transactional Outbox | AKS-000014 |
| Saga | AKS-000015 |
| Eventual Consistency | AKS-000010, AKS-000015, AKS-000016 |
| OAuth 2.x | AKS-000017, AKS-000018 |
| OpenID Connect | AKS-000019 |
| Observability | AKS-000020 |
| Architecture Decision Record | AKS-000021, AKS-000022 |

## Admission boundaries

- AKS-000001 supplies historical and epistemic grounding, not a universal
  software-design recipe.
- AKS-000002 is aerospace-oriented; software recommendations derived from it
  require explicit contextual conditions.
- AKS-000003 and AKS-000022 are licensed standards. Only accessible public
  material may be represented unless a licensed copy is supplied and reviewed.
- Vendor guidance from Microsoft, AWS, Google, and GitLab is admitted only for
  the assessed mechanism or first-party case scope. It cannot establish vendor
  neutrality or universal applicability by itself.
- AKS-000011 defines idempotency for HTTP method semantics. Broader operation
  or message-processing idempotency requires a qualified synthesis.
- AKS-000017 provides the base OAuth 2.0 framework; current security guidance
  must also use AKS-000018.
- AKS-000019 must not be used to collapse authentication into OAuth
  authorization. The distinction is an explicit content requirement.
- AKS-000020 supports observability concepts but does not imply that
  OpenTelemetry is mandatory.
- AKS-000021 is the originating ADR proposal, not an international standard.
  AKS-000022 provides architecture-description context but does not prescribe
  the ADR format.

## Human decision required

Before claims can be authored, a human must explicitly approve, restrict, or
reject each candidate source. A bulk approval is acceptable if it names this
twenty-two-source package and accepts the admission boundaries above.
