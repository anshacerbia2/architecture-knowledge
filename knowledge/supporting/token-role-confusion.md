---
id: AKC-000023
record_kind: concept
title: Token Role Confusion
aliases:
  - OAuth token confusion
type: failure-mode
secondary_types: []
domain: security-privacy
subdomains:
  - supporting-concepts
dimensions:
  - interaction
  - trust-security
status: proposed
maturity: seed
summary: A security failure mode in which a token is accepted under a role, issuer, audience, or semantic contract different from the one for which it was issued.
tags:
  - failure-mode
  - oauth
  - tokens
problem: OAuth and OpenID Connect use multiple token types whose syntax can look similar while their consumers and meanings differ.
context: Authorization servers, OpenID Providers, clients, relying parties, and resource servers that exchange access, refresh, and ID tokens.
intent: Represent trust failures caused by collapsing token roles or validation contexts.
forces:
  - Tokens can share encoding.
  - Multiple issuers coexist.
  - Libraries hide validation defaults.
  - Consumers seek convenient identity data.
applicable_when:
  - statement: Use when a component accepts a token without proving its intended issuer, audience, type, and protocol role.
    concept_ids: []
    scope: edge-local
avoid_when:
  - statement: Do not apply the label to a correctly validated token merely because several token types use JWT encoding.
    concept_ids: []
    scope: edge-local
prerequisites: []
quality_attributes:
  improves: []
  degrades: []
  influences: []
constraints:
  - statement: Token role must be evaluated against the issuer, audience, client, recipient, and protocol context for which the token was issued.
    scope: edge-local
    concept_ids: []
assumptions:
  - statement: Consumers know the expected token type and validation context before accepting a token.
    scope: edge-local
    concept_ids: []
benefits:
  - Keeps OAuth authorization and OIDC authentication failures explicit.
tradeoffs:
  - The node groups several attacks that still require precise threat analysis.
risks:
  - statement: Treating token syntax as proof of role hides issuer, audience, nonce, and authorized-party requirements.
    scope: edge-local
    concept_ids: []
failure_modes: []
security_implications:
  - Threat assumptions include an attacker who can obtain or replay a valid token issued for another client, audience, issuer, or role.
operational_implications:
  - Monitor issuer and audience failures, key and metadata drift, token-type errors, and unexpected presentation paths.
data_implications:
  - Token claims and logs can expose personal or authorization data; role confusion can widen disclosure.
alternatives:
  - statement: Boundary erosion is structural; token role confusion is a protocol trust failure.
    scope: edge-local
    concept_ids: []
related:
  - AKC-000017
  - AKC-000018
relationships:
  - AKR-000023
examples:
  - statement: An API accepts an ID Token minted for a web client as though it were an API access token.
    scope: edge-local
    concept_ids: []
counterexamples:
  - statement: A resource server validating an access token's issuer, audience, expiry, and authorization policy is not token-role confusion.
    scope: edge-local
    concept_ids: []
claims:
  - AKL-000043
  - AKL-000047
sources:
  - AKS-000017
  - AKS-000018
  - AKS-000019
review:
  owner: null
  reviewers: []
  created_at: 2026-07-29
  updated_at: 2026-07-30
  reviewed_at: null
  review_due_at: null
version: 2
contextual_roles: []
---

# Token Role Confusion

## Summary

A security failure mode in which a token is accepted under a role, issuer, audience, or semantic contract different from the one for which it was issued.

## Intent

Represent trust failures caused by collapsing token roles or validation contexts.

## Context

Authorization servers, OpenID Providers, clients, relying parties, and resource servers that exchange access, refresh, and ID tokens.

## Problem

OAuth and OpenID Connect use multiple token types whose syntax can look similar while their consumers and meanings differ.

## Forces

Tokens can share encoding. Multiple issuers coexist. Libraries hide validation defaults. Consumers seek convenient identity data.

## How It Works

A token crosses into a consumer that validates insufficient context and interprets claims under a different trust contract, enabling substitution or unauthorized decisions.

## Structural View

Issuer, token, presenter, consumer, audience, and validation policy form the trust path.

## Runtime View

An attacker or faulty client presents a token to an unintended consumer; incomplete validation accepts it and applies the wrong semantics.

## Applicability

Use when a component accepts a token without proving its intended issuer, audience, type, and protocol role.

## When Not to Use It

Do not apply the label to a correctly validated token merely because several token types use JWT encoding.

## Quality Attribute Impact

It degrades confidentiality, integrity, and authorization correctness while the protocol endpoints may remain available.

## Benefits

Keeps OAuth authorization and OIDC authentication failures explicit.

## Trade-offs

The node groups several attacks that still require precise threat analysis.

## Risks and Failure Modes

Treating token syntax as proof of role hides issuer, audience, nonce, and authorized-party requirements.

## Security Implications

Threat assumptions include an attacker who can obtain or replay a valid token issued for another client, audience, issuer, or role.

## Data Implications

Token claims and logs can expose personal or authorization data; role confusion can widen disclosure.

## Operational Implications

Monitor issuer and audience failures, key and metadata drift, token-type errors, and unexpected presentation paths.

## Implementation Variants

ID-token-as-access-token, cross-client substitution, audience confusion, and issuer mix-up are variants.

## Alternatives

Boundary erosion is structural; token role confusion is a protocol trust failure.

## Decision Guide

Use the node when acceptance depends on token syntax or claims without complete context validation.

## Verification and Testing

Attempt issuer, audience, client, token-type, nonce, and replay substitutions at every consumer.

## Examples

An API accepts an ID Token minted for a web client as though it were an API access token.

## Counterexamples

A resource server validating an access token's issuer, audience, expiry, and authorization policy is not token-role confusion.

## Related Concepts

OAuth 2.0 and OpenID Connect define distinct token consumers and roles; confusion is caused by validation-context failure, not by the protocols intrinsically.

## Claims and Evidence

AKL-000043, AKL-000047 ground the failure mechanism and its corpus relationship.

## Sources

AKS-000017, AKS-000018, AKS-000019 provide admitted evidence within the approved admission boundaries.
