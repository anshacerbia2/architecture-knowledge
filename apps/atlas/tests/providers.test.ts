import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { providers } from "../packages/knowledge-adapter/src/providers.js";
import { PilotBudget } from "../packages/knowledge-adapter/src/pilot-budget.js";
import { configuration } from "../apps/api/src/config.js";

const manifest = `sha256:${"a".repeat(64)}`;
let directory: string;
let budgetFile: string;
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-17T00:00:00Z"));
  directory = mkdtempSync(path.join(os.tmpdir(), "atlas-provider-test-"));
  budgetFile = path.join(directory, "budget.txt");
  new PilotBudget(budgetFile).initialize();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  rmSync(directory, { recursive: true, force: true });
});
const settings = () => ({
  mode: "openai" as const,
  apiKey: "synthetic-key",
  publicManifest: manifest,
  budgetFile,
});
it("keeps fake mode as default and rejects incomplete or unknown live configuration", () => {
  expect(configuration({}).provider).toEqual({ mode: "fake" });
  expect(() => configuration({ ATLAS_PROVIDER_MODE: "other" })).toThrow("PROVIDER_MODE_INVALID");
  const env = {
    ATLAS_PROVIDER_MODE: "openai",
    ATLAS_LIVE_CONSENT: "public-only-usd5",
    OPENAI_API_KEY: "synthetic",
    ATLAS_PUBLIC_MANIFEST: manifest,
  };
  expect(configuration(env).provider.mode).toBe("openai");
  for (const key of ["ATLAS_LIVE_CONSENT", "OPENAI_API_KEY", "ATLAS_PUBLIC_MANIFEST"])
    expect(() => configuration({ ...env, [key]: "" })).toThrow();
  expect(providers({ mode: "fake" }, manifest).budget).toBeNull();
});
it("binds live egress consent to an exact manifest before constructing providers", () => {
  expect(() => providers(settings(), `sha256:${"b".repeat(64)}`)).toThrow();
  expect(() => providers({ ...settings(), publicManifest: "public" }, "public")).toThrow();
  expect(() => providers({ ...settings(), budgetFile: "missing" }, manifest)).toThrow();
  expect(() => providers({ ...settings(), apiKey: " " }, manifest)).toThrow();
});
it("exercises actual embedding adapter through the shared bounded transport", async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        model: "text-embedding-3-small",
        data: [{ index: 0, embedding: Array(1536).fill(0.1) }],
      }),
    ),
  );
  vi.stubGlobal("fetch", transport);
  const live = providers(settings(), manifest);
  expect(live.answer.model).toBe("gpt-5.6-sol");
  expect(live.answer.allowedDataClassifications).toEqual(["public"]);
  expect(live.embedding.allowedDataClassifications).toEqual(["public"]);
  expect(await live.embedding.embedQuery("synthetic public query")).toHaveLength(1536);
  expect(live.budget?.status().reserved_cents).toBe(1);
  expect(transport.mock.calls[0]![0]).toBe("https://api.openai.com/v1/embeddings");
});
it("does not automatically retry provider failures or reset the budget", async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 429 }));
  vi.stubGlobal("fetch", transport);
  await expect(providers(settings(), manifest).embedding.embedQuery("public")).rejects.toThrow();
  expect(transport).toHaveBeenCalledTimes(1);
  expect(new PilotBudget(budgetFile).status().reserved_cents).toBe(1);
});

it("exercises the actual Responses adapter with strict JSON and store:false, without a live call", async () => {
  const output = {
    status: "insufficient-evidence",
    summary: "Synthetic evidence is insufficient.",
    statements: [],
    uncertainties: ["synthetic"],
    refusal_reason: null,
  };
  const transport = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        model: "gpt-5.6-sol",
        status: "completed",
        output: [
          { type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] },
        ],
      }),
    ),
  );
  vi.stubGlobal("fetch", transport);
  const live = providers(settings(), manifest);
  type Context = Parameters<typeof live.answer.generate>[0];
  type Request = Parameters<typeof live.answer.generate>[1];
  const context = {
    data_classification: "public",
    evidence: [],
    context_fingerprint: manifest,
  } as unknown as Context;
  const request = {
    data_classification: "public",
    question: "synthetic",
    project_context: {},
    answer: { max_output_tokens: 1800, max_statements: 8, allow_recommendations: false },
  } as unknown as Request;
  expect(await live.answer.generate(context, request)).toEqual(output);
  const payload = JSON.parse(transport.mock.calls[0]![1]!.body as string);
  expect(payload).toMatchObject({
    model: "gpt-5.6-sol",
    store: false,
    text: { format: { type: "json_schema", strict: true } },
    max_output_tokens: 1800,
  });
  expect(live.budget?.status().reserved_cents).toBe(50);
  transport.mockClear();
  await expect(
    live.answer.generate(
      { ...context, data_classification: "internal" },
      { ...request, data_classification: "internal" },
    ),
  ).rejects.toThrow();
  expect(transport).not.toHaveBeenCalled();
});
