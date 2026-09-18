# OpenRouter free mode and two credential connectors

Status: proposed engineering implementation. No governed content or decision is approved. Scope:
single-turn Ask Knowledge through OpenRouter, using either a server API key or an account connection
through OAuth PKCE. This is not enterprise SSO, Google/Microsoft login to Atlas, or reuse of a
ChatGPT subscription. No M7.3 decision runtime is added.

## Free model and retrieval boundary

The pinned route is `nvidia/nemotron-3.5-lightning:free`. The public catalog and endpoint listing
were read on 2026-09-17 without credentials: prompt/completion prices were zero and function calling
and forced function selection were listed. This route did not list support for `response_format` or
`structured_outputs`. This is availability metadata, not successful inference or semantic-quality
evidence.

Before each inference, the adapter rereads the public catalog, requires the exact route, zero prices
and `tools`/`tool_choice` support. It uses Chat Completions with one forced
`submit_architecture_answer` function whose parameters are the kernel's existing answer JSON schema.
The function is an output envelope, not an executable tool. Exactly one completed function call with
the registered name and JSON-string arguments is required. The existing local output parser
validates those arguments; provider-side schema enforcement is not assumed. Other message text is
never displayed. There is no tool execution, continuation loop or second model call. Kernel
instructions and input mapping remain in force. Returned model must match the requested route
exactly; undocumented alias changes fail closed. The existing citation-authority and grounding
checks still run before display.

Requests specify zero maximum prompt/completion/request/image prices, no provider fallbacks,
required parameter support, `only: ["nvidia"]`, and default `data_collection: deny`. No executable
tools, model fallback lists, external embeddings or premium options are enabled. The old direct
OpenAI connector cannot be selected automatically. Errors, exhausted quota or no eligible free
endpoint are surfaced without a paid retry or privacy-policy relaxation. Provider enforcement
remains an external dependency; this is not a guarantee about all charges on an account used by
other apps. Use a dedicated key with a provider-side spending restriction if available. Reported
nonzero inference cost rejects the response. HTTP rejection messages expose only the upstream status
code or a fixed data-policy diagnostic, never upstream error bodies, credentials or prompts.

### Explicit public-data logging opt-in

On 2026-09-18, Ansha Cerbia explicitly consented in the project conversation to provider recording
of public questions and evidence for the pinned NVIDIA free route. This is operational data-egress
consent, not approval of knowledge, claims or decisions. The ignored local `.env` records that
choice:

```dotenv
ATLAS_OPENROUTER_DATA_POLICY=nvidia-public-logging
```

Only this exact value enables `data_collection: allow`; omission or `no-collection` retains `deny`,
and unknown values fail startup. The model and provider remain pinned to NVIDIA's free endpoint. Its
published notice says inputs may be recorded for security and service improvement. Do not send
personal, confidential or secret data, even if manually labeled Public. Internal/confidential
request classifications remain blocked before retrieval or inference, and the public manifest check
still applies.

The request-level opt-in does not override account privacy settings or guardrails. If OpenRouter
returns a data-policy rejection, Atlas reports `OPENROUTER_DATA_POLICY_BLOCKED`; the operator must
review the account setting themselves. Atlas never changes it or retries under weaker settings.
Removing the local opt-in and restarting restores the no-collection policy; it cannot retract data
already transmitted. This does not enable Atlas prompt logging or persistent chat history.

Free mode retrieves **lexically from PostgreSQL**, not with semantic vectors or graph expansion. It
uses the existing fake-contract DB generation only as indexed storage; neither fake query embedding
nor paid embedding is invoked. Hybrid search is rejected with an instruction to select Lexical. Ask
automatically selects lexical retrieval; the UI and status disclose this limitation. Graph
inspection remains available. English corpus terminology may retrieve better than Indonesian
paraphrases. Do not claim free mode has equivalent semantic recall to real hybrid retrieval.

Per process there is one active generation, at least three seconds between attempts, and at most
twenty attempts. The upstream account's limits still apply across restarts and keys. Requests cap
output at 4096 tokens and payload at 65,536 UTF-8 bytes. There is one HTTP attempt, with bounded
timeouts and redirects disabled. No API call uses the credential exposed in conversation;
replace/revoke it at OpenRouter.

## Connector architecture and flow

The application layer defines a backend-only `AiCredentialPort`. Two adapters implement it:

| Connector | Credential source                                      | Lifetime                                | Disconnect                                                                                |
| --------- | ------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `api`     | `OPENROUTER_API_KEY` in server environment             | Until configuration changes and restart | Remove key locally, restart; revoke remotely when needed                                  |
| `oauth`   | OpenRouter authorization-code exchange using S256 PKCE | Server memory only                      | Forget locally and invalidate pending flows; remote revocation remains a dashboard action |

API flow: UI question → local HTTP validation → public-only guard → lexical retrieval → free-price
check → credential port → OpenRouter → strict output/grounding checks → UI.

OAuth flow:

1. User clicks **Connect OpenRouter** on System status. A same-origin POST with the existing app
   token starts authorization; the browser cannot supply a callback URL.
2. Server creates random state, browser nonce and PKCE verifier. Verifier stays server-side; browser
   nonce uses a host-only HttpOnly SameSite=Lax cookie, scoped to the callback.
3. Browser navigates to the fixed OpenRouter authorization endpoint. The callback path contains the
   random state; it does not depend on an undocumented echoed state parameter.
4. Callback must match browser cookie/state within five minutes. Flow is consumed before exchanging
   the code on the fixed HTTPS endpoint. Replay and concurrent redemption fail.
5. Server stores the returned credential in memory and redirects to `/status`, removing the
   authorization code from the active URL. No credential or verifier is returned to JS.
6. Disconnect/new authorization invalidates pending exchanges, including responses arriving after
   disconnect. Restart forgets the credential and requires reconnecting.

Only the registered GET callback permits cross-site top-level navigation. Normal API routes retain
Host/Origin/CSRF protections. Callback responses have no-store and no-referrer headers; operational
logs contain route templates, not codes or raw URLs. The cookie is not Secure because the supported
deployment is loopback HTTP only; this design must not be copied unchanged to remote production. All
tabs share the one trusted local operator's connector. OAuth connects AI usage; it is not Atlas user
authentication.

## Configure and run (repository root)

Use the current committed implementation with a clean worktree and `pnpm build`. Keep the existing
database settings in **`apps/atlas/.env`**. The unrelated file `D:/Ansha/AI/ai-backend/.env` is not
read by Atlas.

First run `pnpm app:pilot plan`. Inspect the corpus identified by `public_manifest_to_review`; only
affirm that hash if all of its evidence is suitable for public egress. This snapshot-level consent
is required because units have no per-unit privacy classification. It is not human approval of
claims or decisions.

Recommended account connection (no manual key):

```dotenv
ATLAS_PROVIDER_MODE=openrouter-free
ATLAS_AI_CONNECTOR=oauth
ATLAS_LIVE_CONSENT=openrouter-public-free-only
ATLAS_PUBLIC_MANIFEST=sha256:REPLACE_WITH_REVIEWED_MANIFEST
```

Alternatively, use a newly rotated API key:

```dotenv
ATLAS_PROVIDER_MODE=openrouter-free
ATLAS_AI_CONNECTOR=api
ATLAS_LIVE_CONSENT=openrouter-public-free-only
ATLAS_PUBLIC_MANIFEST=sha256:REPLACE_WITH_REVIEWED_MANIFEST
OPENROUTER_API_KEY=REPLACEMENT_KEY_SET_LOCALLY
```

Stop the previous Atlas app before changing the active DB generation. Run each command separately
and stop on errors:

```powershell
pnpm build
pnpm app:pilot index
pnpm app:pilot check
pnpm app:start
```

When `apps/atlas/.env` already contains the hosted Neon URL, the root helper performs the same three
operations without manually setting a temporary environment variable:

```powershell
pnpm retrieval:hosted:setup
```

It keeps the URL out of output and forces the stored deterministic embedding contract used by free
mode.

In this mode indexing uses deterministic local vectors, incurs no model-provider calls and does not
require a budget ledger or `init-budget`. The exact-commit DB contract still requires indexing after
merge/commit changes. No new DB migration is introduced. Runtime can use a read-only DB role;
indexing needs a writer. An index failure must not be treated as a successful activation.

Open http://127.0.0.1:4310/status. In OAuth mode click **Connect OpenRouter**, login and authorize,
then return to System status. In API mode the credential presence is shown as connected, not as
proof of account access, credit or model readiness. In Explore select **Lexical**; in Ask try
`Can Retry and Circuit Breaker be combined?` with classification Public. Internal/confidential
inputs are blocked before retrieval/provider calls.

Do not paste secrets into questions or chat. A public label does not detect private information. No
key or credential is added to the browser bundle, source control or DB.

## Verification and remaining limitations

Unit and HTTP tests use synthetic credentials and mocked provider exchange/inference. They cover
code replay, wrong state/browser, expiry, disconnect races, foreign origins, unchanged CSRF
boundary, paid/missing catalogs, model switches, malformed outputs, wrong/multiple function calls,
invalid answer arguments, ignored extra prose, redacted HTTP failures, refusal, rate limits, privacy
and lexical-only routing. Browser tests verify UI behavior with transport fixtures. Coverage and
mutation include the new connector/provider/routes.

Real OAuth login/callback compatibility, free inference access, actual latency, returned model
naming, Indonesian quality and source fidelity still need a user-authorized live test with a
replacement key or completed OAuth flow. Public catalog access does not prove those outcomes. No
hidden benchmark or new knowledge corpus is introduced. Local disconnect does not revoke the
generated key on OpenRouter; manage unused keys there. Free endpoint availability and privacy/format
compatibility may leave no eligible route. This is an explicit failure state, not grounds to enable
paid fallback.

## Official references

- [OAuth PKCE and local callbacks](https://openrouter.ai/docs/guides/overview/auth/oauth).
- [Provider pricing, fallback and privacy controls](https://openrouter.ai/docs/guides/routing/provider-selection).
- [Function calling and tool choice](https://openrouter.ai/docs/guides/features/tool-calling).
- [NVIDIA free endpoint data notice](https://openrouter.ai/nvidia/nemotron-3.5-lightning:free).
- [Model catalog](https://openrouter.ai/api/v1/models).
- [Pinned free route endpoints](https://openrouter.ai/api/v1/models/nvidia/nemotron-3.5-lightning:free/endpoints).
- [Upstream account rate limits](https://openrouter.ai/docs/api/reference/limits).
