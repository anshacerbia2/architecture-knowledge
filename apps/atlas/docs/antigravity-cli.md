# Antigravity CLI runner

Atlas invokes the installed `agy -p` with the user's existing CLI login. No Gemini API key, Python
SDK, new installation, or OpenRouter credential is needed for this mode. The initial
capability-inventory gate is superseded by Ansha's explicit request on 2026-09-18 to use the
ordinary local print runner. An advertised tool inventory was not proof that print generation was
broken or that profile restrictions were ineffective.

## Run

In the ignored `apps/atlas/.env`:

```dotenv
ATLAS_PROVIDER_MODE=antigravity-cli
ATLAS_AGY_EXECUTABLE=C:/Users/YOUR_USER/AppData/Local/agy/bin/agy.exe
ATLAS_LIVE_CONSENT=agy-public-cloud-cli-history
ATLAS_PUBLIC_MANIFEST=sha256:EXACT_PUBLIC_MANIFEST_HASH
```

Leave the existing Neon database settings unchanged. Then, from repository root:

```powershell
pnpm app:agy:check
pnpm app:start
```

The check sends a small public prompt to the cloud and consumes CLI quota. It verifies structured
output, not architecture-answer quality. If not already authenticated, sign in using an interactive
`agy` session. Atlas does not read or copy account tokens. Startup still requires a validated clean
committed checkout and an index for that SHA. After a new commit, run `pnpm retrieval:hosted:setup`
before restarting the app.

## Request flow

1. Atlas rejects non-public input before retrieval and verifies the public manifest.
2. Neon lexical retrieval selects up to 6 units / 1,400 estimated tokens, with graph expansion off.
   This keeps the Windows print command bounded. Fake stored vectors remain an index compatibility
   contract; no fake semantic retrieval is performed.
3. The adapter passes the question, governed context, and kernel JSON schema to `agy -p`, pinned to
   `gemini-3.8-flash-low`, with JSON output and a 90-second CLI timeout.
4. It checks successful exit, a successful JSON envelope, and structured output. CLI `num_turns` may
   include an internal schema completion turn; Atlas submits one prompt and does not resume any
   conversation.
5. The existing kernel validates the answer structure, evidence, epistemic labels, and citation
   grounding. Only the validated answer reaches the browser. No lifecycle or source-admission
   authority changes.

## Local trust and privacy boundary

This is a **trusted-user local CLI runner, not an inference-only tool sandbox**. It preserves normal
CLI permissions and does not use `--dangerously-skip-permissions` or modify permission settings.
Prompt instructions discourage tools; they are not an enforcement boundary. Existing CLI account
settings, rules, plugins, and retention remain controlled by the user. The earlier optional global
`atlas-answer` profile is not selected or required by this runner.

- Only non-secret public inputs and an explicitly public manifest are allowed.
- The executable is spawned directly with an argument array, `shell:false`, and a fresh temporary
  working directory outside the repository. CLI argument text is visible to local process
  inspection; this mode is not suitable for shared machines.
- Application secrets, database URLs, API keys, proxy variables, and `NODE_OPTIONS` are not
  forwarded in the child environment. CLI account state remains accessible through the user's normal
  OS profile.
- Atlas does not log prompt text, model output, or stderr. CLI/provider history may persist
  independently; clearing the browser does not erase that history.
- There is one active request per runner, a 20-attempt provider-instance ceiling, conservative
  Windows command-line size check, 1 MiB combined process output limit, and a 95-second parent
  deadline. CLI internal retries and account charges are not governed by Atlas's OpenAI pilot
  budget. No free-price guarantee is made.
- No automatic provider fallback, model fallback configured by Atlas, conversation resume, global
  permission bypass, or raw model-token streaming is used.
- The configured model slug is provenance about the requested model, not independent attestation of
  the provider's returned model. This is not a hosted multi-user service.

## Verification boundary

Synthetic tests cover direct spawn arguments, size/time/concurrency limits, UTF-8, malformed output,
failed exits, schema validation, private-input rejection, and cleanup. On 2026-09-18, a real public
circuit-breaker question using the Neon index, AGY print runner, and the kernel RAG engine returned
`answered`: two statements, each with two validated citations. This establishes observed
functionality, not calibrated model quality, exhaustive semantic entailment, or OS-level
process/tool isolation. Hosted CI has not been run for these local changes.

## References

- [Official print mode, structured JSON, cached authentication, and default permissions](https://antigravity.google/docs/cli/headless/)
- [SDK investigation: API-key or Google Cloud authentication, not required here](https://antigravity.google/docs/sdk/overview/)
