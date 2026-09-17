import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { AiCredentialPort } from "../../application/src/ai-credential-port.js";
import { AppError } from "../../application/src/errors.js";

const invalid = () =>
  new AppError(
    "OPENROUTER_AUTH_REQUIRED",
    401,
    "Connect your OpenRouter account or configure a replacement API key locally.",
  );
function validKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    /^sk-or-v1-[a-zA-Z0-9_-]{20,256}$/.test(value)
  );
}

export class OpenRouterApiConnector implements AiCredentialPort {
  readonly mode = "api" as const;
  constructor(private readonly key: string) {
    if (!validKey(key)) throw invalid();
  }
  connected() {
    return true;
  }
  apiKey() {
    return this.key;
  }
}

export class OpenRouterOAuthConnector implements AiCredentialPort {
  readonly mode = "oauth" as const;
  private key: string | null = null;
  private flow: {
    state: string;
    verifier: string;
    browser: string;
    expires: number;
    epoch: number;
  } | null = null;
  private epoch = 0;
  constructor(private readonly transport: typeof fetch = fetch) {}
  connected() {
    return this.key !== null;
  }
  apiKey() {
    if (!this.key) throw invalid();
    return this.key;
  }
  disconnect() {
    this.key = null;
    this.flow = null;
    this.epoch++;
  }

  begin(origin: string) {
    const url = new URL(origin);
    if (
      url.protocol !== "http:" ||
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new AppError("OAUTH_ORIGIN_INVALID", 400, "Use the local Atlas origin.");
    const state = randomBytes(32).toString("hex");
    const browser = randomBytes(32).toString("hex");
    const verifier = randomBytes(32).toString("base64url");
    this.flow = { state, browser, verifier, expires: Date.now() + 300_000, epoch: ++this.epoch };
    const authorization = new URL("https://openrouter.ai/auth");
    // State in the registered callback path avoids relying on undocumented OAuth state echo.
    authorization.searchParams.set(
      "callback_url",
      `${url.origin}/api/v1/connectors/openrouter/callback/${state}`,
    );
    authorization.searchParams.set(
      "code_challenge",
      createHash("sha256").update(verifier).digest("base64url"),
    );
    authorization.searchParams.set("code_challenge_method", "S256");
    return { authorization_url: authorization.href, browser };
  }

  async complete(state: string, code: string, browser: string) {
    const flow = this.flow;
    if (
      !flow ||
      Date.now() >= flow.expires ||
      state.length !== 64 ||
      browser.length !== 64 ||
      !/^[a-f0-9]{64}$/.test(state) ||
      !/^[a-f0-9]{64}$/.test(browser) ||
      !timingSafeEqual(Buffer.from(state), Buffer.from(flow.state)) ||
      !timingSafeEqual(Buffer.from(browser), Buffer.from(flow.browser)) ||
      code !== code.trim() ||
      !/^[a-zA-Z0-9._~-]{1,2048}$/.test(code)
    )
      throw invalid();
    this.flow = null; // Consume before exchange; no replay or concurrent redemption.
    try {
      const response = await this.transport("https://openrouter.ai/api/v1/auth/keys", {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, code_verifier: flow.verifier, code_challenge_method: "S256" }),
      });
      if (!response.ok) throw invalid();
      const result = (await response.json()) as { key?: unknown };
      if (!validKey(result?.key) || flow.epoch !== this.epoch) throw invalid();
      this.key = result.key;
    } catch {
      throw invalid();
    }
  }
}
