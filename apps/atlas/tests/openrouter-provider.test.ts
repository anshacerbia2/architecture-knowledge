import { afterEach, expect, it, vi } from "vitest";
import { parseRagRequest, type RagContextPacket } from "architecture-knowledge-system/runtime";
import {
  OpenRouterFreeProvider,
  OPENROUTER_FREE_MODEL,
} from "../packages/knowledge-adapter/src/openrouter-provider.js";
import {
  OpenRouterApiConnector,
  OpenRouterOAuthConnector,
} from "../packages/ai-connectors/src/openrouter-connectors.js";
import { configuration } from "../apps/api/src/config.js";
import { providers } from "../packages/knowledge-adapter/src/providers.js";

const KEY = `sk-or-v1-${"synthetic".repeat(5)}`;
const context = {
  data_classification: "public",
  context_fingerprint: "synthetic",
  evidence: [],
} as unknown as RagContextPacket;
const request = () =>
  parseRagRequest({ question: "synthetic public question", data_classification: "public" });
const entry = () => ({
  id: OPENROUTER_FREE_MODEL,
  pricing: { prompt: "0", completion: "0" },
  supported_parameters: ["structured_outputs"],
});
const output = {
  status: "insufficient-evidence",
  summary: "Synthetic example only.",
  statements: [],
  uncertainties: [],
  refusal_reason: null,
};
const response = () => ({
  model: OPENROUTER_FREE_MODEL,
  choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }],
  usage: { cost: 0 },
});
const json = (value: unknown) => new Response(JSON.stringify(value));
const make = (transport: typeof fetch) =>
  new OpenRouterFreeProvider(new OpenRouterApiConnector(KEY), transport);
afterEach(() => vi.restoreAllMocks());

it("supports distinct API/OAuth config, public manifest consent and free provider composition", () => {
  const manifest = `sha256:${"a".repeat(64)}`;
  const env = {
    ATLAS_PROVIDER_MODE: "openrouter-free",
    ATLAS_LIVE_CONSENT: "openrouter-public-free-only",
    ATLAS_PUBLIC_MANIFEST: manifest,
  };
  const oauth = configuration(env);
  expect(oauth.connector?.mode).toBe("oauth");
  expect(oauth.connector?.connected()).toBe(false);
  expect(providers(oauth.provider, manifest)).toMatchObject({
    mode: "openrouter-free",
    budget: null,
  });
  expect(providers(oauth.provider, manifest).answer.model).toBe(OPENROUTER_FREE_MODEL);
  expect(
    configuration({
      ...env,
      ATLAS_AI_CONNECTOR: "api",
      OPENROUTER_API_KEY: KEY,
    }).connector?.connected(),
  ).toBe(true);
  for (const bad of [
    { ATLAS_LIVE_CONSENT: "" },
    { ATLAS_PUBLIC_MANIFEST: "bad" },
    { ATLAS_AI_CONNECTOR: "saml" },
    { ATLAS_AI_CONNECTOR: "api" },
  ])
    expect(() => configuration({ ...env, ...bad })).toThrow();
});
it("sends only the pinned zero-price structured request and validates the returned model and output", async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(json({ data: [entry()] }))
    .mockResolvedValueOnce(json(response()));
  const provider = make(transport);
  expect(provider.provider).toBe("openrouter");
  expect(provider.allowedDataClassifications).toEqual(["public"]);
  expect(await provider.generate(context, request())).toEqual(output);
  expect(transport.mock.calls[0]![0]).toBe("https://openrouter.ai/api/v1/models");
  expect(transport.mock.calls[0]![1]?.headers).toBeUndefined();
  const [url, sent] = transport.mock.calls[1]!;
  expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
  expect(sent).toMatchObject({
    method: "POST",
    redirect: "error",
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const body = JSON.parse(sent!.body as string);
  expect(body).toMatchObject({
    model: OPENROUTER_FREE_MODEL,
    stream: false,
    max_tokens: 1800,
    provider: {
      allow_fallbacks: false,
      require_parameters: true,
      data_collection: "deny",
      max_price: { prompt: 0, completion: 0, request: 0, image: 0 },
    },
    response_format: {
      type: "json_schema",
      json_schema: { strict: true, name: "architecture_rag_answer" },
    },
  });
  expect(body.tools).toBeUndefined();
  expect(body.models).toBeUndefined();
  expect(body.messages[0].role).toBe("system");
  expect(body.messages[1].content).toContain("synthetic public question");
});
it("rejects disconnected or non-public requests without metadata or inference calls", async () => {
  const transport = vi.fn<typeof fetch>();
  const provider = make(transport);
  await expect(
    provider.generate(
      { ...context, data_classification: "internal" },
      { ...request(), data_classification: "internal" },
    ),
  ).rejects.toThrow();
  await expect(
    new OpenRouterFreeProvider(new OpenRouterOAuthConnector(), transport).generate(
      context,
      request(),
    ),
  ).rejects.toThrow();
  expect(transport).not.toHaveBeenCalled();
});
it.each([
  null,
  {},
  { data: [] },
  { data: [{ ...entry(), id: "paid/model" }] },
  { data: [{ ...entry(), pricing: { prompt: "1", completion: "0" } }] },
  { data: [{ ...entry(), pricing: { prompt: "0", completion: "0", request: "0.01" } }] },
  { data: [{ ...entry(), pricing: { prompt: "0", completion: "0", request: "NaN" } }] },
  { data: [{ ...entry(), pricing: { prompt: "0", completion: "0", request: 0 } }] },
  { data: [{ ...entry(), supported_parameters: [] }] },
])("blocks missing/paid/incompatible catalog without sending evidence (%j)", async (catalog) => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(json(catalog));
  await expect(make(transport).generate(context, request())).rejects.toMatchObject({
    code: "OPENROUTER_FREE_CONTRACT_UNAVAILABLE",
  });
  expect(transport).toHaveBeenCalledOnce();
});
it.each([
  null,
  { ...response(), model: "other/model" },
  { ...response(), choices: [] },
  { ...response(), usage: { cost: 0.01 } },
  { ...response(), choices: [null] },
  { ...response(), choices: [{ finish_reason: "length", message: { content: "{}" } }] },
  { ...response(), choices: [{ finish_reason: "stop", message: { content: "not json" } }] },
  {
    ...response(),
    choices: [{ finish_reason: "stop", message: { content: "{}", tool_calls: [] } }],
  },
])("rejects malformed, switched, charged or truncated output (%j)", async (result) => {
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(json({ data: [entry()] }))
    .mockResolvedValueOnce(json(result));
  await expect(make(transport).generate(context, request())).rejects.toThrow();
  expect(transport).toHaveBeenCalledTimes(2);
});
it("honors refusal, HTTP failures, timeout errors and payload/output bounds without retry", async () => {
  for (const result of [
    json({ ...response(), choices: [{ message: { refusal: "unsafe" } }] }),
    new Response("secret provider error", { status: 429 }),
    new Response("secret provider error", { status: 402 }),
  ]) {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: [entry()] }))
      .mockResolvedValueOnce(result);
    await expect(make(transport).generate(context, request())).rejects.toThrow();
    expect(transport).toHaveBeenCalledTimes(2);
  }
  const failed = vi.fn<typeof fetch>().mockRejectedValue(new Error("sensitive detail"));
  await expect(make(failed).generate(context, request())).rejects.toMatchObject({
    code: "OPENROUTER_RESPONSE_INVALID",
  });
  const denied = vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 503 }));
  await expect(make(denied).generate(context, request())).rejects.toMatchObject({
    code: "OPENROUTER_CATALOG_UNAVAILABLE",
  });
  const transport = vi.fn<typeof fetch>().mockResolvedValue(json({ data: [entry()] }));
  const r = request();
  await expect(
    make(transport).generate(context, { ...r, answer: { ...r.answer, max_output_tokens: 4097 } }),
  ).rejects.toThrow();
  await expect(
    make(transport).generate(context, { ...r, question: "x".repeat(65536) }),
  ).rejects.toThrow();
  expect(transport).toHaveBeenCalledOnce();
});
it("limits concurrent, rapid and per-process attempts, and rechecks pricing each time", async () => {
  let time = Date.now();
  vi.spyOn(Date, "now").mockImplementation(() => time);
  const transport = vi
    .fn<typeof fetch>()
    .mockImplementation(async (url) =>
      json(String(url).endsWith("/models") ? { data: [entry()] } : response()),
    );
  const provider = make(transport);
  const pending = provider.generate(context, request());
  await expect(provider.generate(context, request())).rejects.toThrow();
  await pending;
  await expect(provider.generate(context, request())).rejects.toThrow();
  for (let i = 1; i < 20; i++) {
    time += 3000;
    await provider.generate(context, request());
  }
  time += 3000;
  await expect(provider.generate(context, request())).rejects.toThrow();
  expect(transport).toHaveBeenCalledTimes(40);
});
