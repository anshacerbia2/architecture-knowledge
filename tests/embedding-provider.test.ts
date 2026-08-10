import { describe, expect, it, vi } from "vitest";

import {
  DeterministicFakeEmbeddingProvider,
  OpenAIEmbeddingProvider,
  validateEmbeddingVector,
} from "../src/embedding-provider.js";

describe("M5 embedding providers", () => {
  it("requires credentials, preserves classification policy, and handles empty batches", async () => {
    expect(() => new OpenAIEmbeddingProvider({ apiKey: " " })).toThrow(
      "RETRIEVAL_EMBEDDING_AUTH_MISSING",
    );
    const fetchMock = vi.fn();
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "x",
      allowedDataClassifications: ["internal"],
      fetchImplementation: fetchMock,
    });
    expect(provider.allowedDataClassifications).toEqual(["internal"]);
    await expect(provider.embedDocuments([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("produces stable normalized local vectors without a network call", async () => {
    const provider = new DeterministicFakeEmbeddingProvider({ dimension: 16 });
    const first = await provider.embedQuery("OIDC issuer validation");
    expect(await provider.embedQuery("OIDC issuer validation")).toEqual(first);
    expect(first).toHaveLength(16);
    expect(Math.sqrt(first.reduce((sum, value) => sum + value * value, 0))).toBeCloseTo(1);
  });

  it("supports controlled fake failures and malformed fixtures", async () => {
    await expect(
      new DeterministicFakeEmbeddingProvider({ fail: true }).embedQuery("x"),
    ).rejects.toThrow("FAKE_FAILURE");
    expect(() => validateEmbeddingVector([0], 2)).toThrow("RETRIEVAL_EMBEDDING_DIMENSION");
    expect(() => validateEmbeddingVector([Number.NaN], 1)).toThrow("RETRIEVAL_EMBEDDING_NONFINITE");
    expect(() => validateEmbeddingVector([Number.POSITIVE_INFINITY], 1)).toThrow(
      "RETRIEVAL_EMBEDDING_NONFINITE",
    );
  });

  it("batches production requests and validates model, count, and dimension", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { input: string[] };
      return new Response(
        JSON.stringify({
          model: "text-embedding-3-small",
          data: request.input.map((_text, index) => ({
            index,
            embedding: Array.from({ length: 1536 }, () => 0.5),
          })),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "not-a-real-secret",
      batchSize: 2,
      concurrency: 1,
      fetchImplementation: fetchMock,
    });
    expect(await provider.embedDocuments(["a", "b", "c"])).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[1]?.headers)).not.toContain("not-a-real-secret");
  });

  it("retries retryable responses but never retries authentication failures", async () => {
    const sleep = vi.fn(async () => undefined);
    const retrying = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            model: "text-embedding-3-small",
            data: [{ index: 0, embedding: Array.from({ length: 1536 }, () => 0) }],
          }),
          { status: 200 },
        ),
      );
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "x",
      fetchImplementation: retrying,
      sleep,
      random: () => 0,
    });
    expect(await provider.embedQuery("query")).toHaveLength(1536);
    expect(retrying).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(200);

    const auth = vi.fn(async () => new Response("no", { status: 401 }));
    await expect(
      new OpenAIEmbeddingProvider({ apiKey: "x", fetchImplementation: auth }).embedQuery("q"),
    ).rejects.toThrow("RETRIEVAL_EMBEDDING_AUTH");
    expect(auth).toHaveBeenCalledTimes(1);
  });

  it("rejects provider model, count, item, and vector contract drift", async () => {
    const response = (body: unknown) =>
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
    const wrongModel = response({ model: "other", data: [] });
    await expect(
      new OpenAIEmbeddingProvider({ apiKey: "x", fetchImplementation: wrongModel }).embedQuery("q"),
    ).rejects.toThrow("CONTRACT");
    const wrongCount = response({ model: "text-embedding-3-small", data: [] });
    await expect(
      new OpenAIEmbeddingProvider({ apiKey: "x", fetchImplementation: wrongCount }).embedQuery("q"),
    ).rejects.toThrow("count");
    const wrongItem = response({
      model: "text-embedding-3-small",
      data: [{ index: 1, embedding: [] }],
    });
    await expect(
      new OpenAIEmbeddingProvider({ apiKey: "x", fetchImplementation: wrongItem }).embedQuery("q"),
    ).rejects.toThrow("item");
    const short = response({
      model: "text-embedding-3-small",
      data: [{ index: 0, embedding: [0] }],
    });
    await expect(
      new OpenAIEmbeddingProvider({ apiKey: "x", fetchImplementation: short }).embedQuery("q"),
    ).rejects.toThrow("DIMENSION");
    for (const body of [null, [], { model: "text-embedding-3-small", data: "invalid" }]) {
      await expect(
        new OpenAIEmbeddingProvider({
          apiKey: "x",
          fetchImplementation: response(body),
        }).embedQuery("q"),
      ).rejects.toThrow("CONTRACT");
    }
  });

  it("restores provider response order and enforces configuration bounds", async () => {
    const first = Array.from({ length: 1536 }, () => 0);
    const second = Array.from({ length: 1536 }, () => 0);
    first[0] = 1;
    second[0] = 2;
    const unordered = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            model: "text-embedding-3-small",
            data: [
              { index: 1, embedding: second },
              { index: 0, embedding: first },
            ],
          }),
          { status: 200 },
        ),
    );
    const provider = new OpenAIEmbeddingProvider({ apiKey: "x", fetchImplementation: unordered });
    const result = await provider.embedDocuments(["first", "second"]);
    expect(result[0]?.[0]).toBe(1);
    expect(result[1]?.[0]).toBe(2);
    for (const options of [
      { batchSize: 0 },
      { concurrency: 9 },
      { timeoutMs: 99 },
      { maxAttempts: 1.5 },
    ]) {
      expect(() => new OpenAIEmbeddingProvider({ apiKey: "x", ...options })).toThrow(
        "RETRIEVAL_EMBEDDING_CONFIG",
      );
    }
  });

  it.each([408, 409, 429, 500, 501])("retries retryable HTTP %i", async (status) => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response("retry", { status }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            model: "text-embedding-3-small",
            data: [{ index: 0, embedding: Array.from({ length: 1536 }, () => 0) }],
          }),
          { status: 200 },
        ),
      );
    const provider = new OpenAIEmbeddingProvider({
      apiKey: "x",
      fetchImplementation: request,
      sleep: async () => undefined,
      random: () => 0,
    });
    await expect(provider.embedQuery("q")).resolves.toHaveLength(1536);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("classifies 403 as non-retryable authentication failure", async () => {
    const forbidden = vi.fn(async () => new Response("no", { status: 403 }));
    await expect(
      new OpenAIEmbeddingProvider({ apiKey: "x", fetchImplementation: forbidden }).embedQuery("q"),
    ).rejects.toThrow("RETRIEVAL_EMBEDDING_AUTH");
    expect(forbidden).toHaveBeenCalledTimes(1);
  });

  it("stops at configured attempts and classifies exhausted network failures", async () => {
    const serverError = vi.fn(async () => new Response("error", { status: 500 }));
    await expect(
      new OpenAIEmbeddingProvider({
        apiKey: "x",
        maxAttempts: 1,
        fetchImplementation: serverError,
      }).embedQuery("q"),
    ).rejects.toThrow("RETRIEVAL_EMBEDDING_HTTP status=500");
    expect(serverError).toHaveBeenCalledTimes(1);

    const network = vi.fn(async () => {
      throw new TypeError("network unavailable");
    });
    await expect(
      new OpenAIEmbeddingProvider({
        apiKey: "x",
        maxAttempts: 2,
        fetchImplementation: network,
        sleep: async () => undefined,
      }).embedQuery("q"),
    ).rejects.toThrow("RETRIEVAL_EMBEDDING_UNAVAILABLE TypeError");
    expect(network).toHaveBeenCalledTimes(2);
  });
});
