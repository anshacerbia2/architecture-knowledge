import {
  appendFileSync,
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { AppError } from "../../application/src/errors.js";

// Conservative reservations, not invoice amounts. See docs/live-provider-pilot.md.
export const PILOT_LIMIT_CENTS = 500;
export const PILOT_EXPIRES = "2026-10-01T00:00:00.000Z";
const HEADER = "atlas-openai-pilot-v1:500:2026-10-01";
const fail = (code: string): never => {
  throw new AppError(
    code,
    503,
    "Live pilot is blocked. Check its budget ledger and setup instructions.",
  );
};

export class PilotBudget {
  constructor(private readonly file: string) {}

  // Explicit operator command only. Never reset or recreate from runtime code.
  initialize() {
    mkdirSync(path.dirname(this.file), { recursive: true });
    const fd = openSync(this.file, "wx", 0o600);
    try {
      writeFileSync(fd, `${HEADER}\n`);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
  }

  status() {
    let content: string;
    try {
      content = readFileSync(this.file, "utf8");
    } catch {
      return fail("PILOT_BUDGET_UNAVAILABLE");
    }
    const lines = content.split("\n");
    if (lines.shift() !== HEADER || lines.pop() !== "") return fail("PILOT_BUDGET_INVALID");
    let reserved = 0;
    for (const line of lines) {
      // Each line is a durable reservation written before a network attempt.
      if (line !== "1" && line !== "50") return fail("PILOT_BUDGET_INVALID");
      reserved += Number(line);
    }
    if (reserved > PILOT_LIMIT_CENTS) return fail("PILOT_BUDGET_INVALID");
    return {
      limit_cents: PILOT_LIMIT_CENTS,
      reserved_cents: reserved,
      remaining_cents: PILOT_LIMIT_CENTS - reserved,
      expires_at: PILOT_EXPIRES,
    };
  }

  reserve(cents: 1 | 50) {
    if (Date.now() >= Date.parse(PILOT_EXPIRES)) return fail("PILOT_PRICE_REVIEW_REQUIRED");
    const lock = `${this.file}.lock`;
    let fd: number;
    try {
      fd = openSync(lock, "wx", 0o600);
    } catch {
      return fail("PILOT_BUDGET_LOCKED");
    }
    try {
      if (this.status().remaining_cents < cents) return fail("PILOT_BUDGET_EXHAUSTED");
      const ledger = openSync(this.file, "a");
      try {
        appendFileSync(ledger, `${cents}\n`);
        fsyncSync(ledger);
      } finally {
        closeSync(ledger);
      }
    } finally {
      closeSync(fd);
      unlinkSync(lock);
    }
  }
}

/** Only these two fixed text-only API shapes may consume the approved pilot budget. */
export function pilotFetch(budget: PilotBudget, transport: typeof fetch = fetch): typeof fetch {
  return async (url, init) => {
    if (typeof url !== "string" || init?.method !== "POST" || typeof init.body !== "string")
      return fail("PILOT_REQUEST_DENIED");
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(init.body);
    } catch {
      return fail("PILOT_REQUEST_DENIED");
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      return fail("PILOT_REQUEST_DENIED");
    const embedding = url === "https://api.openai.com/v1/embeddings";
    if (embedding) {
      if (
        body.model !== "text-embedding-3-small" ||
        !Array.isArray(body.input) ||
        body.input.length === 0 ||
        body.input.some((t) => typeof t !== "string" || !t.trim()) ||
        Object.keys(body).some((k) => !["model", "input", "encoding_format"].includes(k))
      )
        return fail("PILOT_REQUEST_DENIED");
    } else {
      if (
        url !== "https://api.openai.com/v1/responses" ||
        body.model !== "gpt-5.6-sol" ||
        body.store !== false ||
        !Number.isInteger(body.max_output_tokens) ||
        Number(body.max_output_tokens) < 256 ||
        Number(body.max_output_tokens) > 4096 ||
        !Array.isArray(body.input) ||
        body.input.length !== 2 ||
        Object.keys(body).some(
          (k) => !["model", "store", "max_output_tokens", "input", "text"].includes(k),
        )
      )
        return fail("PILOT_REQUEST_DENIED");
      for (const message of body.input) {
        if (
          !message ||
          !["developer", "user"].includes(message.role) ||
          !Array.isArray(message.content) ||
          message.content.length !== 1 ||
          message.content[0]?.type !== "input_text" ||
          typeof message.content[0]?.text !== "string"
        )
          return fail("PILOT_REQUEST_DENIED");
      }
      body.service_tier = "default";
      body.reasoning = { effort: "low" };
    }
    const payload = JSON.stringify(body);
    // All input including JSON schema and message framing is conservatively bounded.
    if (Buffer.byteLength(payload, "utf8") > 65_536) return fail("PILOT_PAYLOAD_TOO_LARGE");
    budget.reserve(embedding ? 1 : 50);
    // No refunds on HTTP failures, lost responses or invalid output; no redirected requests.
    return transport(url, { ...init, body: payload, redirect: "error" });
  };
}
