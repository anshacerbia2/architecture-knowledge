import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PilotBudget, pilotFetch } from "../packages/knowledge-adapter/src/pilot-budget.js";

let directory: string;
let file: string;
let budget: PilotBudget;
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-17T00:00:00Z"));
  directory = mkdtempSync(path.join(os.tmpdir(), "atlas-budget-test-"));
  file = path.join(directory, "state/budget.txt");
  budget = new PilotBudget(file);
  budget.initialize();
});
afterEach(() => {
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});
const embeddingUrl = "https://api.openai.com/v1/embeddings";
const responseUrl = "https://api.openai.com/v1/responses";
const embedding = () => ({
  model: "text-embedding-3-small",
  input: ["public synthetic"],
  encoding_format: "float",
});
const response = () => ({
  model: "gpt-5.6-sol",
  store: false,
  max_output_tokens: 4096,
  input: [
    { role: "developer", content: [{ type: "input_text", text: "synthetic instruction" }] },
    { role: "user", content: [{ type: "input_text", text: "synthetic public evidence" }] },
  ],
  text: { format: { type: "json_schema" } },
});
const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

it("persists reservations across instances, including exact cap, and never auto-resets", () => {
  expect(budget.status()).toEqual({
    limit_cents: 500,
    reserved_cents: 0,
    remaining_cents: 500,
    expires_at: "2026-10-01T00:00:00.000Z",
  });
  for (let i = 0; i < 10; i++) new PilotBudget(file).reserve(50);
  expect(budget.status().remaining_cents).toBe(0);
  expect(() => budget.reserve(1)).toThrow();
  expect(() => budget.initialize()).toThrow();
  expect(budget.status().reserved_cents).toBe(500);
});
it("blocks any request exceeding remaining cents without appending", () => {
  for (let i = 0; i < 10; i++) budget.reserve(i === 9 ? 1 : 50);
  const before = readFileSync(file, "utf8");
  expect(() => budget.reserve(50)).toThrow();
  expect(readFileSync(file, "utf8")).toBe(before);
});
it("fails closed on missing, corrupt, truncated and over-cap ledger", () => {
  expect(() => new PilotBudget(path.join(directory, "missing")).status()).toThrow();
  const header = readFileSync(file, "utf8");
  for (const content of [
    "",
    "forged\n",
    header + "50",
    header + "-1\n",
    header + "NaN\n",
    header + "0\n",
    header + "50\n".repeat(11),
  ]) {
    writeFileSync(file, content);
    expect(() => budget.reserve(1)).toThrow();
  }
});
it("does not remove another process lock and requires review after price expiry", () => {
  writeFileSync(`${file}.lock`, "synthetic owner");
  expect(() => budget.reserve(1)).toThrow();
  expect(readFileSync(`${file}.lock`, "utf8")).toBe("synthetic owner");
  rmSync(`${file}.lock`);
  vi.mocked(Date.now).mockReturnValue(Date.parse("2026-10-01T00:00:00Z"));
  expect(() => budget.reserve(1)).toThrow();
  expect(budget.status().reserved_cents).toBe(0);
});
it("reserves before every network attempt, forbids redirects and fixes service tier", async () => {
  const transport = vi.fn<typeof fetch>().mockImplementation(async () => {
    expect(budget.status().reserved_cents).toBeGreaterThan(0);
    return new Response("{}");
  });
  const request = pilotFetch(budget, transport);
  await request(embeddingUrl, post(embedding()));
  await request(responseUrl, post(response()));
  expect(budget.status().reserved_cents).toBe(51);
  const sent = transport.mock.calls[1]![1]!;
  expect(sent.redirect).toBe("error");
  expect(JSON.parse(sent.body as string)).toMatchObject({
    service_tier: "default",
    reasoning: { effort: "low" },
    store: false,
  });
});
it("does not refund lost responses or failed HTTP attempts", async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockRejectedValueOnce(new Error("synthetic disconnect"))
    .mockResolvedValueOnce(new Response("", { status: 429 }));
  const request = pilotFetch(budget, transport);
  await expect(request(responseUrl, post(response()))).rejects.toThrow();
  await request(responseUrl, post(response()));
  expect(budget.status().reserved_cents).toBe(100);
});
it("bounds concurrent requests by durable reservations, not in-flight completion", async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}"));
  const request = pilotFetch(budget, transport);
  const results = await Promise.allSettled(
    Array.from({ length: 12 }, () => request(responseUrl, post(response()))),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
  expect(transport).toHaveBeenCalledTimes(10);
});
it.each([
  ["https://evil.invalid/embeddings", embedding()],
  [embeddingUrl + "?redirect=1", embedding()],
  [embeddingUrl, { ...embedding(), model: "other" }],
  [embeddingUrl, { ...embedding(), input: [] }],
  [embeddingUrl, { ...embedding(), input: [2] }],
  [embeddingUrl, { ...embedding(), input: [""] }],
  [embeddingUrl, { ...embedding(), extra: true }],
  [responseUrl, { ...response(), model: "other" }],
  [responseUrl, { ...response(), store: true }],
  [responseUrl, { ...response(), max_output_tokens: 4097 }],
  [responseUrl, { ...response(), max_output_tokens: 255 }],
  [responseUrl, { ...response(), max_output_tokens: 500.5 }],
  [responseUrl, { ...response(), tools: [{ type: "web_search" }] }],
  [responseUrl, { ...response(), input: [] }],
  [responseUrl, { ...response(), input: [null, null] }],
  [
    responseUrl,
    {
      ...response(),
      input: [
        { role: "user", content: [{ type: "input_image", image_url: "https://evil.invalid" }] },
        null,
      ],
    },
  ],
  [responseUrl, null],
  [responseUrl, []],
  [embeddingUrl, { ...embedding(), input: ["x".repeat(65_536)] }],
])("denies unapproved shape %s before network or reservation", async (url, body) => {
  const transport = vi.fn<typeof fetch>();
  await expect(pilotFetch(budget, transport)(url, post(body))).rejects.toThrow();
  expect(transport).not.toHaveBeenCalled();
  expect(budget.status().reserved_cents).toBe(0);
});
it("denies non-string requests, wrong methods and malformed JSON", async () => {
  const transport = vi.fn<typeof fetch>();
  const request = pilotFetch(budget, transport);
  for (const init of [undefined, { method: "GET" }, { method: "POST", body: "{" }])
    await expect(request(embeddingUrl, init)).rejects.toThrow();
  await expect(request(new URL(embeddingUrl), post(embedding()))).rejects.toThrow();
  expect(transport).not.toHaveBeenCalled();
});

it("tests independent egress and mixed-input regressions without masking one invalid field with another", async () => {
  const transport = vi.fn<typeof fetch>();
  const request = pilotFetch(budget, transport);
  await expect(request("https://evil.invalid/responses", post(response()))).rejects.toMatchObject({
    code: "PILOT_REQUEST_DENIED",
  });
  await expect(
    request(embeddingUrl, { ...post(embedding()), method: "GET" }),
  ).rejects.toMatchObject({ code: "PILOT_REQUEST_DENIED" });
  for (const input of [
    ["valid", " "],
    ["valid", 5],
  ])
    await expect(request(embeddingUrl, post({ ...embedding(), input }))).rejects.toMatchObject({
      code: "PILOT_REQUEST_DENIED",
    });
  const valid = response().input[0]!;
  for (const invalid of [
    { ...valid, role: "tool" },
    { ...valid, content: "text" },
    { ...valid, content: [] },
    { ...valid, content: [...valid.content, ...valid.content] },
    { ...valid, content: [{ type: "input_image", text: "synthetic" }] },
    { ...valid, content: [{ type: "input_text", text: 2 }] },
  ]) {
    await expect(
      request(responseUrl, post({ ...response(), input: [invalid, response().input[1]] })),
    ).rejects.toMatchObject({ code: "PILOT_REQUEST_DENIED" });
  }
  expect(transport).not.toHaveBeenCalled();
  expect(budget.status().reserved_cents).toBe(0);
});

it("accepts exact payload and minimum output boundaries but counts UTF-8 bytes, not characters", async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}"));
  const request = pilotFetch(budget, transport);
  const base = { ...embedding(), input: ["x"] };
  const overhead = Buffer.byteLength(JSON.stringify(base)) - 1;
  await request(embeddingUrl, post({ ...base, input: ["x".repeat(65536 - overhead)] }));
  await expect(
    request(embeddingUrl, post({ ...base, input: ["x".repeat(65537 - overhead)] })),
  ).rejects.toMatchObject({ code: "PILOT_PAYLOAD_TOO_LARGE" });
  await expect(
    request(embeddingUrl, post({ ...base, input: ["界".repeat(24000)] })),
  ).rejects.toMatchObject({ code: "PILOT_PAYLOAD_TOO_LARGE" });
  await request(responseUrl, post({ ...response(), max_output_tokens: 256 }));
  expect(transport).toHaveBeenCalledTimes(2);
});
