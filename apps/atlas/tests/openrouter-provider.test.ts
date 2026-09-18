import { afterEach, expect, it, vi } from "vitest";
import {
  parseRagRequest,
  RAG_MODEL_OUTPUT_SCHEMA,
  type RagContextPacket,
} from "architecture-knowledge-system/runtime";
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
  citation_catalog: [],
} as unknown as RagContextPacket;
const request = () =>
  parseRagRequest({ question: "synthetic public question", data_classification: "public" });
const entry = () => ({
  id: OPENROUTER_FREE_MODEL,
  pricing: { prompt: "0", completion: "0" },
  supported_parameters: ["tools", "tool_choice", "reasoning"],
});
const output = {
  status: "insufficient-evidence",
  summary: "Synthetic example only.",
  statements: [],
  uncertainties: [],
  refusal_reason: null,
};
const answerCall = () => ({
  id: "call_synthetic",
  type: "function",
  function: { name: "submit_architecture_answer", arguments: JSON.stringify(output) },
});
const response = () => ({
  model: OPENROUTER_FREE_MODEL,
  choices: [
    { finish_reason: "tool_calls", message: { content: null, tool_calls: [answerCall()] } },
  ],
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
    { ATLAS_OPENROUTER_DATA_POLICY: "allow" },
    { ATLAS_OPENROUTER_DATA_POLICY: "" },
  ])
    expect(() => configuration({ ...env, ...bad })).toThrow();
});
it("sends only the pinned zero-price structured request and validates the returned model and output", async () => {
  const timeout = vi.spyOn(AbortSignal, "timeout");
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(json({ data: [entry()] }))
    .mockResolvedValueOnce(json(response()));
  const provider = make(transport);
  expect(provider.provider).toBe("openrouter");
  expect(provider.model).toBe("nvidia/nemotron-3.5-lightning:free");
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
    reasoning: { enabled: false },
    provider: {
      allow_fallbacks: false,
      require_parameters: true,
      data_collection: "deny",
      only: ["nvidia"],
      max_price: { prompt: 0, completion: 0, request: 0, image: 0 },
    },
    tool_choice: { type: "function", function: { name: "submit_architecture_answer" } },
  });
  expect(body.tools).toHaveLength(1);
  expect(body.tools[0]).toMatchObject({
    type: "function",
    function: { name: "submit_architecture_answer", parameters: RAG_MODEL_OUTPUT_SCHEMA },
  });
  expect(body.tools[0].function.strict).toBeUndefined();
  expect(
    body.tools[0].function.parameters.properties.statements.items.properties.statement_id,
  ).toMatchObject({ pattern: "^S[0-9]{4}$" });
  expect(body.messages[0].content).toContain("S0001, S0002");
  expect(body.response_format).toBeUndefined();
  expect(body.models).toBeUndefined();
  expect(body.messages[0].role).toBe("system");
  expect(body.messages[1].content).toContain("synthetic public question");
  expect(timeout.mock.calls.map(([milliseconds]) => milliseconds)).toEqual([15000, 90000]);
  expect(JSON.parse(body.messages[1].content)).toMatchObject({
    context: { question: "synthetic public question" },
    resolved_citations: [],
  });
});
it("sends only authoritative citation bindings as guidance without manufacturing model citations", async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(json({ data: [entry()] }))
    .mockResolvedValueOnce(json(response()));
  await make(transport).generate(
    {
      ...context,
      citation_catalog: [
        {
          evidence_id: "E0001",
          source_id: "AKS-000001",
          citation_id: "C0001",
          title: "Synthetic",
          url: "https://example.com",
          locators: [],
        },
      ],
    },
    request(),
  );
  const body = JSON.parse(transport.mock.calls[1]![1]!.body as string);
  expect(JSON.parse(body.messages[1].content).resolved_citations).toEqual([
    { evidence_id: "E0001", source_id: "AKS-000001" },
  ]);
  expect(
    body.tools[0].function.parameters.properties.statements.items.properties.evidence_ids,
  ).toMatchObject({ uniqueItems: true, items: { pattern: "^E[0-9]{4}$" } });
  expect(
    body.tools[0].function.parameters.properties.statements.items.properties.claim_ids,
  ).toMatchObject({ uniqueItems: true, items: { pattern: "^AKL-[0-9]{6}$" } });
});
it.each([undefined, "no-collection", "nvidia-public-logging"])(
  "propagates explicit data policy %s from configuration to the request without weakening other guards",
  async (policy) => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: [entry()] }))
      .mockResolvedValueOnce(json(response()));
    vi.stubGlobal("fetch", transport);
    try {
      const manifest = `sha256:${"a".repeat(64)}`;
      const config = configuration({
        ATLAS_PROVIDER_MODE: "openrouter-free",
        ATLAS_LIVE_CONSENT: "openrouter-public-free-only",
        ATLAS_PUBLIC_MANIFEST: manifest,
        ATLAS_AI_CONNECTOR: "api",
        OPENROUTER_API_KEY: KEY,
        ...(policy === undefined ? {} : { ATLAS_OPENROUTER_DATA_POLICY: policy }),
      });
      const provider = providers(config.provider, manifest).answer;
      for (const classification of ["internal", "confidential"] as const)
        await expect(
          provider.generate(
            { ...context, data_classification: classification },
            { ...request(), data_classification: classification },
          ),
        ).rejects.toThrow();
      expect(transport).not.toHaveBeenCalled();
      expect(await provider.generate(context, request())).toEqual(output);
      const body = JSON.parse(transport.mock.calls[1]![1]!.body as string);
      expect(body.model).toBe("nvidia/nemotron-3.5-lightning:free");
      expect(body.provider).toEqual({
        data_collection: policy === "nvidia-public-logging" ? "allow" : "deny",
        only: ["nvidia"],
        allow_fallbacks: false,
        require_parameters: true,
        max_price: { prompt: 0, completion: 0, request: 0, image: 0 },
      });
      expect(body.models).toBeUndefined();
      expect(transport).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  },
);
it.each([
  { message: "No endpoints found matching your data policy. secret detail", blocked: true },
  { message: "Review privacy settings. secret detail", blocked: true },
  { message: "No endpoints available. secret detail", blocked: false },
  { message: null, blocked: false },
])(
  "redacts 404 details and classifies a data-policy rejection (%j)",
  async ({ message, blocked }) => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: [entry()] }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message } }), { status: 404 }));
    const error = await make(transport)
      .generate(context, request())
      .catch((e: unknown) => e);
    expect(error).toMatchObject({
      code: blocked ? "OPENROUTER_DATA_POLICY_BLOCKED" : "OPENROUTER_REQUEST_FAILED",
    });
    expect((error as Error).message).not.toContain("secret detail");
    expect(transport).toHaveBeenCalledTimes(2);
  },
);
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
  { data: [{ ...entry(), supported_parameters: ["tools"] }] },
  { data: [{ ...entry(), supported_parameters: ["tool_choice"] }] },
  { data: [{ ...entry(), supported_parameters: ["structured_outputs"] }] },
  { data: [{ ...entry(), supported_parameters: ["tools", "tool_choice"] }] },
  { data: [{ ...entry(), reasoning: { mandatory: true } }] },
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
it.each(
  [
    [],
    [answerCall(), answerCall()],
    [null],
    [{ ...answerCall(), type: "other" }],
    [{ ...answerCall(), function: null }],
    [{ ...answerCall(), function: { name: "execute_shell", arguments: "{}" } }],
    [{ ...answerCall(), function: { ...answerCall().function, arguments: output } }],
    [{ ...answerCall(), function: { ...answerCall().function, arguments: "not json" } }],
    [{ ...answerCall(), function: { ...answerCall().function, arguments: "{}" } }],
  ].map((calls) => ({ calls })),
)(
  "rejects invalid answer submissions without execution or a second inference (%j)",
  async ({ calls }) => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: [entry()] }))
      .mockResolvedValueOnce(
        json({
          ...response(),
          choices: [{ finish_reason: "tool_calls", message: { tool_calls: calls } }],
        }),
      );
    await expect(make(transport).generate(context, request())).rejects.toThrow();
    expect(transport).toHaveBeenCalledTimes(2);
  },
);
it.each(["stop", "length", "error"])(
  "rejects answer arguments with incomplete finish reason %s",
  async (finishReason) => {
    const result = response();
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: [entry()] }))
      .mockResolvedValueOnce(
        json({ ...result, choices: [{ ...result.choices[0], finish_reason: finishReason }] }),
      );
    await expect(make(transport).generate(context, request())).rejects.toMatchObject({
      code: "OPENROUTER_OUTPUT_CONTRACT",
    });
  },
);
it("never displays unvalidated content alongside the answer submission", async () => {
  const result = response();
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(json({ data: [entry()] }))
    .mockResolvedValueOnce(
      json({
        ...result,
        choices: [
          {
            ...result.choices[0],
            message: { ...result.choices[0]!.message, content: "Untrusted extra prose" },
          },
        ],
      }),
    );
  expect(await make(transport).generate(context, request())).toEqual(output);
});
it.each([400, 401, 402, 403, 404, 429, 502, 503])(
  "reports only safe HTTP status %i without leaking upstream details",
  async (status) => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: [entry()] }))
      .mockResolvedValueOnce(new Response("secret provider error", { status }));
    await expect(make(transport).generate(context, request())).rejects.toMatchObject({
      code: status === 429 ? "OPENROUTER_RATE_LIMIT" : "OPENROUTER_REQUEST_FAILED",
      message: `OpenRouter rejected the free request (HTTP ${status}). No paid fallback was attempted.`,
    });
    expect(transport).toHaveBeenCalledTimes(2);
  },
);
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
it.each(["TimeoutError", "AbortError"])(
  "classifies %s during catalog, inference and body reads without leaking details or retrying",
  async (name) => {
    for (const stage of ["catalog", "inference", "body"] as const) {
      const failure = Object.assign(new Error("secret diagnostic"), { name });
      const transport = vi.fn<typeof fetch>();
      if (stage !== "catalog") transport.mockResolvedValueOnce(json({ data: [entry()] }));
      if (stage === "body") {
        const failedResponse = json({});
        vi.spyOn(failedResponse, "json").mockRejectedValue(failure);
        transport.mockResolvedValueOnce(failedResponse);
      } else transport.mockRejectedValueOnce(failure);
      const error = await make(transport)
        .generate(context, request())
        .catch((e: unknown) => e);
      expect(error).toMatchObject({ code: "OPENROUTER_TIMEOUT", status: 504 });
      expect((error as Error).message).toContain(stage === "catalog" ? "catalog" : "inference");
      expect((error as Error).message).not.toContain("secret diagnostic");
      expect(transport).toHaveBeenCalledTimes(stage === "catalog" ? 1 : 2);
    }
  },
);
it.each(["S1", "statement_1", "S0001"])(
  "enforces kernel statement ID format for %s without rewriting identifiers",
  async (id) => {
    const result = response();
    const answered = {
      ...output,
      status: "answered",
      statements: [
        {
          statement_id: id,
          text: "Synthetic statement.",
          epistemic_type: "sourced-claim",
          evidence_ids: ["E0001"],
          claim_ids: ["AKL-000001"],
          conditions: [],
          alternatives: [],
          trade_offs: [],
          confidence: "low",
        },
      ],
    };
    result.choices[0]!.message.tool_calls[0]!.function.arguments = JSON.stringify(answered);
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: [entry()] }))
      .mockResolvedValueOnce(json(result));
    if (id === "S0001")
      expect(await make(transport).generate(context, request())).toEqual(answered);
    else
      await expect(make(transport).generate(context, request())).rejects.toMatchObject({
        code: "OPENROUTER_ANSWER_SCHEMA_INVALID",
      });
  },
);
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
