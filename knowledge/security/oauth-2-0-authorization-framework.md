---
id: AKC-000017
record_kind: concept
title: OAuth 2.0 Authorization Framework
aliases:
  - OAuth 2.0
type: protocol
secondary_types: []
domain: security-privacy
subdomains:
  - authorization
dimensions:
  - interaction
  - trust-security
status: drafted
maturity: seed
summary: The RFC 6749 authorization framework, deployed with RFC 9700 Security BCP requirements and with each extension or profile governed separately.
tags:
  - oauth
  - authorization
  - tokens
problem: Applications need delegated or service authorization without sharing a resource owner's primary credentials with every client.
context: HTTP-based ecosystems with authorization servers, resource servers, clients, explicit trust boundaries, and protected resources.
intent: Separate authorization delegation and token issuance from protected-resource access.
forces:
  - Client types have different security capabilities.
  - Tokens are bearer credentials in common deployments.
  - Redirects and browsers create attack surfaces.
  - Scopes are not complete business authorization.
  - Standards evolve.
applicable_when:
  - statement: Use when delegated or service access to HTTP resources needs standardized authorization flows and ecosystem interoperability.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Do not use OAuth alone as proof of end-user authentication or as a replacement for resource-specific authorization policy.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: OAuth 2.0 deployment must apply the admitted Security BCP and the requirements of each selected extension or profile.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: Authorization server, resource server, client type, user agent, resource owner, and protected resource boundaries are known.
    scope: edge-local
    concept_ids: []
benefits:
  - Standardized delegated authorization.
  - Reduced credential sharing.
  - Separation of token issuance and resource enforcement.
tradeoffs:
  - Large security-sensitive configuration surface.
  - Token lifecycle operations.
  - Scopes can become coarse or ambiguous.
risks:
  - statement: Redirect manipulation, code injection, mix-up, bearer-token replay, refresh-token replay, weak client authentication, excess privilege, and audience confusion arise from incomplete profiles or validation.
    scope: edge-local
    concept_ids: []
failure_modes:
  - AKC-000023
security_implications:
  - statement: Public OAuth clients cannot keep credentials confidential, while confidential clients can authenticate only within their registered deployment assumptions.
    kind: implementation-observation
    claim_ids: [AKL-000049]
    scope: edge-local
    concept_ids: []
  - statement: Public OAuth clients using the authorization code grant MUST use PKCE.
    kind: normative-control
    claim_ids: [AKL-000050]
    scope: edge-local
    concept_ids: []
  - statement: Confidential clients making token endpoint requests MUST authenticate using the method established with the authorization server and any stricter selected profile requirements.
    kind: normative-control
    claim_ids: [AKL-000051]
    scope: edge-local
    concept_ids: []
  - statement: Authorization servers MUST compare redirect URIs using exact string matching, except that native-application localhost loopback redirect URIs may vary only by port as specified by RFC 9700.
    kind: normative-control
    claim_ids: [AKL-000052]
    scope: edge-local
    concept_ids: []
  - statement: OAuth deployments MUST NOT use the resource owner password credentials grant.
    kind: normative-control
    claim_ids: [AKL-000053]
    scope: edge-local
    concept_ids: []
  - statement: OAuth deployments SHOULD NOT use the implicit grant or other response types that issue access tokens in the authorization response unless access-token injection is prevented and the relevant leakage vectors are mitigated.
    kind: normative-control
    claim_ids: [AKL-000054]
    scope: edge-local
    concept_ids: []
  - statement: Authorization servers issuing refresh tokens to public clients MUST use sender-constrained refresh tokens or refresh-token rotation, detect replay, and revoke the active refresh token when replay is detected.
    kind: normative-control
    claim_ids: [AKL-000055]
    scope: edge-local
    concept_ids: []
  - statement: OAuth deployments SHOULD use sender-constrained access tokens such as mutual TLS or DPoP when their architecture and performance constraints permit.
    kind: normative-control
    claim_ids: [AKL-000056]
    scope: edge-local
    concept_ids: []
  - statement: Authorization servers SHOULD restrict access-token privileges and audience to the minimum required for the requested resource access.
    kind: normative-control
    claim_ids: [AKL-000057]
    scope: edge-local
    concept_ids: []
  - statement: Resource servers MUST validate that an access token is intended for them and reject a token whose audience or resource binding does not match.
    kind: normative-control
    claim_ids: [AKL-000058]
    scope: edge-local
    concept_ids: []
  - statement: An OAuth bearer access token can be replayed by a party that possesses it unless token use is sender-constrained.
    kind: security-risk
    claim_ids: [AKL-000063]
    scope: edge-local
    concept_ids: []
  - statement: OAuth access tokens are authorization credentials for protected-resource access, and OAuth does not require every access token to use JWT format.
    kind: implementation-observation
    claim_ids: [AKL-000059]
    scope: edge-local
    concept_ids: []
operational_implications:
  - Operate keys, issuer metadata, client registration, redirect inventories, refresh-token replay response, token revocation, telemetry, and configuration-drift controls.
data_implications:
  - Minimize token contents, restrict audiences and privilege, protect tokens and logs, define revocation and retention, and do not treat scopes as complete application authorization policy.
alternatives:
  - statement: Session cookies can suit one first-party web boundary; capability or signed-request designs address different trust models.
    scope: edge-local
    concept_ids: []
related:
  - AKC-000018
relationships:
  - AKR-000013
examples:
  - statement: A user authorizes a client to access a bounded resource scope without giving the client the user's password.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: Treating an access token as proof of user identity, assuming an access token is universally a JWT, giving a public client a shared secret and calling it confidential, or using password or implicit grants as modern defaults violates the governed boundaries.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000017
  - AKL-000033
  - AKL-000049
  - AKL-000050
  - AKL-000051
  - AKL-000052
  - AKL-000053
  - AKL-000054
  - AKL-000055
  - AKL-000056
  - AKL-000057
  - AKL-000058
  - AKL-000059
  - AKL-000063
sources:
  - AKS-000017
  - AKS-000018
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-30
  reviewed_at: null
  review_due_at: null
version: 4
contextual_roles:
  - role: base-framework
    context: AKC-000017 represents RFC 6749 OAuth 2.0 authorization semantics.
  - role: security-bcp-governed
    context: RFC 9700 updates deployment security guidance without becoming OAuth 2.1.
  - role: extension-host
    context: Extensions and deployment profiles remain separate specifications with their own applicability.
---

# OAuth 2.0 Authorization Framework

## Summary

The RFC 6749 authorization framework, deployed with RFC 9700 Security BCP requirements and with each extension or profile governed separately.

## Intent

Separate authorization delegation and token issuance from protected-resource access.

## Context

HTTP authorization involving a resource owner, client, authorization server, resource server, and often a user agent. Public clients cannot keep credentials confidential; confidential clients can authenticate only under their registered deployment assumptions.

## Problem

Applications need delegated or service authorization without sharing a resource owner's primary credentials with every client.

## Forces

Client types have different credential capabilities. Redirects and user agents create attack surfaces. Bearer tokens are replayable if stolen. Refresh tokens extend exposure. Access-token format is deployment-specific. Scopes are not complete business authorization. Standards, extensions, and profiles evolve independently.

## How It Works

A client obtains authorization under an appropriate grant and presents an access token to a resource server. The authorization server authenticates a confidential client where required; a public client is not assumed to keep a secret. The resource server validates token status, issuer or trust source, intended audience, privilege, and local authorization policy.

## Structural View

RFC 6749 defines the OAuth 2.0 framework. RFC 9700 is its admitted Security BCP, not OAuth 2.1. Extension and deployment-profile requirements remain separate. OAuth 2.1 remains outside this sourced node unless admitted as work in progress.

## Runtime View

Modern user-facing flows use authorization-code protections. Public clients using the authorization code grant must use PKCE. Redirect URIs use exact string matching, except that native-application localhost loopback redirect URIs may vary only by port. Refresh tokens issued to public clients require rotation or sender constraint with replay detection. Sender-constrained access tokens such as mTLS or DPoP are recommended when architecture and performance constraints permit.

## Applicability

Use when delegated or service access to HTTP resources needs standardized authorization flows and ecosystem interoperability.

## When Not to Use It

Do not use OAuth alone as proof of end-user authentication or as a replacement for resource-specific authorization policy.

## Quality Attribute Impact

It can improve interoperability and credential separation but increases protocol, redirect, token, key, and policy complexity.

## Benefits

Standardized delegated authorization. Reduced credential sharing. Separation of token issuance and resource enforcement.

## Trade-offs

Large security-sensitive configuration surface. Token lifecycle operations. Scopes can become coarse or ambiguous.

## Risks and Failure Modes

Redirect manipulation, code injection, mix-up, bearer-token replay, refresh-token replay, weak client authentication, excess privilege, and audience confusion arise from incomplete profiles or validation. The resource owner password credentials grant must not be used. The implicit grant and other authorization-response access-token flows should not be used unless injection is prevented and relevant leakage vectors are mitigated.

## Security Implications

Threat assumptions include malicious clients, redirect manipulation, code injection, stolen or replayed tokens, and issuer or audience confusion. Public clients using authorization code must use PKCE. Confidential token-endpoint clients must authenticate using their registered method and selected profile. Redirect matching is exact except for the native localhost loopback-port exception. Password grant is prohibited; implicit and similar front-channel access-token responses should not be used unless injection and leakage risks are mitigated. Public-client refresh tokens require rotation or sender constraint with replay response. Sender-constrained access tokens are recommended when architecture and performance allow. Issuers minimize audience and privilege, and resource servers reject recipient mismatches. OAuth access tokens are authorization credentials and are not universally JWTs.

## Data Implications

Minimize token content and audiences, protect tokens and logs, define revocation and retention, and treat scopes as delegated privilege inputs rather than complete resource authorization or data-ownership policy.

## Operational Implications

Operate key and metadata rotation, client registration and redirect inventories, token revocation, refresh-token replay response, telemetry, and configuration-drift controls. Security BCP and extension updates require explicit governance.

## Implementation Variants

Authorization code, client credentials, device authorization, mTLS, DPoP, and other extensions serve different actors and threats. Their requirements are not silently inherited merely because they are associated with OAuth 2.0.

## Alternatives

Session cookies can suit one first-party web boundary; capability or signed-request designs address different trust models.

## Decision Guide

Choose a grant and profile from client type, user-agent exposure, resource audience, privilege, and threat model. Start with RFC 6749 semantics, apply RFC 9700, and then apply every selected extension or profile explicitly.

## Verification and Testing

Test exact redirects, state and issuer binding, PKCE downgrade and verifier handling, authorization-code replay, token audience and privilege, confidential-client authentication, refresh-token rotation and replay detection, sender constraint where selected, expiry, revocation, and key rotation.

## Examples

A user authorizes a client to access a bounded resource scope without giving the client the user's password.

## Counterexamples

Treating an access token as proof of user identity, assuming an access token is universally a JWT, giving a public client a shared secret and calling it confidential, or using password or implicit grants as modern defaults violates the governed boundaries.

## Related Concepts

OpenID Connect depends on OAuth 2.0 mechanisms but adds authentication semantics; token-role boundaries remain explicit.

## Claims and Evidence

AKL-000049 through AKL-000059 plus AKL-000063 define the client, PKCE, client-authentication, redirect, grant, replay, sender-constraint, audience, recipient-validation, and access-token-role controls. Each claim records exact source locations and normative force where applicable. AKL-000017 and AKL-000033 preserve the framework and OIDC token-role boundaries.

## Sources

AKS-000017 is RFC 6749, the base OAuth 2.0 framework. AKS-000018 is RFC 9700, the admitted Security BCP. Neither source is represented as a finalized OAuth 2.1 specification.
