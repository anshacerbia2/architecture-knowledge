import { describe, expect, it } from "vitest";

import { buildRagContext } from "../src/rag-context.js";
import { parseRagModelOutput, RAG_MODEL_OUTPUT_SCHEMA } from "../src/rag-output-contract.js";
import { DeterministicFakeRagProvider, OpenAIRagProvider } from "../src/rag-provider.js";
import { modelOutput, ragRequest, retrievalPacket, retrievalUnit } from "./rag-helpers.js";

describe("RAG model output contract", () => {
  it("accepts the exact structured answer", () => {
    expect(parseRagModelOutput(modelOutput())).toEqual(modelOutput());
    expect(RAG_MODEL_OUTPUT_SCHEMA.additionalProperties).toBe(false);
  });

  it.each([
    [{ ...modelOutput(), extra: true }, "unsupported field 'extra'"],
    [{ ...modelOutput(), status: "unknown" }, "status is invalid"],
    [{ ...modelOutput(), statements: [] }, "answered output requires"],
    [
      { ...modelOutput(), status: "insufficient-evidence" },
      "insufficient-evidence output must not contain statements",
    ],
    [
      { ...modelOutput(), status: "refused", statements: [], refusal_reason: null },
      "refused output requires refusal_reason",
    ],
    [
      { ...modelOutput(), statements: [{ ...modelOutput().statements[0]!, statement_id: "bad" }] },
      "statements[0].statement_id is invalid",
    ],
    [
      {
        ...modelOutput(),
        statements: [{ ...modelOutput().statements[0]!, evidence_ids: ["E0001", "E0001"] }],
      },
      "statements[0].evidence_ids must not contain duplicates",
    ],
  ])("rejects malformed output %#", (value, message) => {
    expect(() => parseRagModelOutput(value)).toThrow(`RAG_MODEL_OUTPUT_INVALID ${message}`);
  });
});

describe("OpenAI RAG provider", () => {
  const context = buildRagContext(ragRequest(), retrievalPacket());

  it("uses Responses structured outputs, store false, and the pinned model", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const provider = new OpenAIRagProvider({
      apiKey: "test-key",
      fetchImplementation: async (_input, init) => {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return response(modelOutput());
      },
    });
    await expect(provider.generate(context, ragRequest())).resolves.toEqual(modelOutput());
    expect(requestBody).toMatchObject({ model: "gpt-5.6", store: false });
    expect(requestBody?.text).toMatchObject({
      format: { type: "json_schema", strict: true, name: "architecture_rag_answer" },
    });
    expect(JSON.stringify(requestBody)).not.toContain("test-key");
  });

  it("retries transient HTTP failures and then succeeds", async () => {
    let calls = 0;
    const provider = new OpenAIRagProvider({
      apiKey: "key",
      maxAttempts: 2,
      sleep: async () => undefined,
      fetchImplementation: async () => {
        calls += 1;
        return calls === 1 ? new Response("busy", { status: 429 }) : response(modelOutput());
      },
    });
    await provider.generate(context, ragRequest());
    expect(calls).toBe(2);
  });

  it.each([
    [401, "RAG_MODEL_AUTH status=401"],
    [400, "RAG_MODEL_HTTP status=400"],
  ])("classifies terminal HTTP %s", async (status, code) => {
    const provider = new OpenAIRagProvider({
      apiKey: "key",
      fetchImplementation: async () => new Response("failure", { status }),
    });
    await expect(provider.generate(context, ragRequest())).rejects.toThrow(code);
  });

  it("detects refusal, incomplete, model mismatch, and malformed JSON", async () => {
    const values = [
      {
        model: "gpt-5.6",
        status: "completed",
        output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }],
      },
      { model: "gpt-5.6", status: "incomplete", output: [] },
      { model: "wrong", status: "completed", output: [] },
      {
        model: "gpt-5.6",
        status: "completed",
        output: [{ type: "message", content: [{ type: "output_text", text: "{" }] }],
      },
    ];
    const expected = [
      "RAG_MODEL_REFUSAL",
      "RAG_MODEL_INCOMPLETE",
      "RAG_MODEL_CONTRACT",
      "RAG_MODEL_CONTRACT json",
    ];
    for (const [index, value] of values.entries()) {
      const provider = new OpenAIRagProvider({
        apiKey: "key",
        fetchImplementation: async () =>
          new Response(JSON.stringify(value), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      });
      await expect(provider.generate(context, ragRequest())).rejects.toThrow(expected[index]);
    }
  });

  it("rejects missing credentials and invalid runtime bounds", () => {
    expect(() => new OpenAIRagProvider({ apiKey: "" })).toThrow("RAG_MODEL_AUTH_MISSING");
    expect(() => new OpenAIRagProvider({ apiKey: "x", maxAttempts: 0 })).toThrow(
      "RAG_MODEL_CONFIG_INVALID",
    );
  });
});

describe("deterministic fake RAG provider", () => {
  it("copies only directly cited claims and remains deterministic", async () => {
    const provider = new DeterministicFakeRagProvider();
    const context = buildRagContext(ragRequest(), retrievalPacket());
    expect(await provider.generate(context, ragRequest())).toEqual(
      await provider.generate(context, ragRequest()),
    );
  });

  it("returns insufficient evidence for non-claim context", async () => {
    const provider = new DeterministicFakeRagProvider();
    const context = buildRagContext(
      ragRequest(),
      retrievalPacket([retrievalUnit({ unit_kind: "concept-section", record_id: "AKC-000001" })]),
    );
    expect((await provider.generate(context, ragRequest())).status).toBe("insufficient-evidence");
  });

  it("supports deterministic failure and malformed-output fixtures", async () => {
    const context = buildRagContext(ragRequest(), retrievalPacket());
    await expect(
      new DeterministicFakeRagProvider({ fail: true }).generate(context, ragRequest()),
    ).rejects.toThrow("RAG_MODEL_FAKE_FAILURE");
    await expect(
      new DeterministicFakeRagProvider({ output: {} }).generate(context, ragRequest()),
    ).rejects.toThrow("RAG_MODEL_OUTPUT_INVALID");
  });
});

function response(output: unknown): Response {
  return new Response(
    JSON.stringify({
      model: "gpt-5.6",
      status: "completed",
      output: [
        { type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
