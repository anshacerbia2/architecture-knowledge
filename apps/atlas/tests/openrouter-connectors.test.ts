import { afterEach, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import {
  OpenRouterApiConnector,
  OpenRouterOAuthConnector,
} from "../packages/ai-connectors/src/openrouter-connectors.js";

const KEY = `sk-or-v1-${"synthetic".repeat(5)}`;
afterEach(() => vi.restoreAllMocks());
function flow(connector: OpenRouterOAuthConnector) {
  const begin = connector.begin("http://127.0.0.1:4310");
  const url = new URL(begin.authorization_url);
  const callback = new URL(url.searchParams.get("callback_url")!);
  return { ...begin, url, callback, state: callback.pathname.split("/").at(-1)! };
}
it("API connector requires a valid-shaped local key and never performs login", () => {
  const api = new OpenRouterApiConnector(KEY);
  expect(api.mode).toBe("api");
  expect(api.connected()).toBe(true);
  expect(api.apiKey()).toBe(KEY);
  for (const key of ["", "sk-invalid", "sk-or-v1-x", KEY + "\n", KEY + " "])
    expect(() => new OpenRouterApiConnector(key)).toThrow();
});
it("OAuth uses S256 and exchanges on the fixed endpoint without exposing the key in begin", async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify({ key: KEY })));
  const connector = new OpenRouterOAuthConnector(transport);
  expect(connector.mode).toBe("oauth");
  expect(connector.connected()).toBe(false);
  expect(() => connector.apiKey()).toThrow();
  const f = flow(connector);
  expect(f.url.origin).toBe("https://openrouter.ai");
  expect(f.url.pathname).toBe("/auth");
  expect(f.callback.origin).toBe("http://127.0.0.1:4310");
  expect(f.url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(f.authorization_url).not.toContain(KEY);
  await connector.complete(f.state, "synthetic-code", f.browser);
  expect(connector.connected()).toBe(true);
  expect(connector.apiKey()).toBe(KEY);
  const [url, request] = transport.mock.calls[0]!;
  expect(url).toBe("https://openrouter.ai/api/v1/auth/keys");
  expect(request).toMatchObject({ method: "POST", redirect: "error" });
  expect(request?.signal).toBeInstanceOf(AbortSignal);
  const body = JSON.parse(request!.body as string);
  expect(body.code).toBe("synthetic-code");
  expect(body.code_challenge_method).toBe("S256");
  expect(createHash("sha256").update(body.code_verifier).digest("base64url")).toBe(
    f.url.searchParams.get("code_challenge"),
  );
  await expect(connector.complete(f.state, "synthetic-code", f.browser)).rejects.toThrow();
  expect(transport).toHaveBeenCalledOnce();
  connector.disconnect();
  expect(connector.connected()).toBe(false);
  expect(() => connector.apiKey()).toThrow();
});
it("rejects foreign origins, wrong browser/state, expiry, missing flows and invalid codes before exchange", async () => {
  const transport = vi.fn<typeof fetch>();
  const connector = new OpenRouterOAuthConnector(transport);
  for (const origin of [
    "https://evil.example",
    "http://127.0.0.1.evil",
    "http://user@localhost:4310",
    "http://localhost:4310/path",
    "http://localhost:4310/?x=1",
    "http://localhost:4310/#x",
  ])
    expect(() => connector.begin(origin)).toThrow();
  expect(connector.begin("http://localhost:4310").authorization_url).toContain("localhost");
  const f = flow(connector);
  for (const [state, code, browser] of [
    ["x", "code", f.browser],
    ["a".repeat(64), "code", f.browser],
    [f.state, "code", "x"],
    [f.state, "code", "b".repeat(64)],
    [f.state, "", f.browser],
    [f.state, "\n", f.browser],
    [f.state, "x".repeat(2049), f.browser],
  ])
    await expect(connector.complete(state!, code!, browser!)).rejects.toThrow();
  vi.spyOn(Date, "now").mockReturnValue(Date.now() + 300000);
  await expect(connector.complete(f.state, "code", f.browser)).rejects.toThrow();
  expect(transport).not.toHaveBeenCalled();
});
it("single-use flows stay consumed on provider failures; errors never expose response data", async () => {
  for (const result of [
    new Response("private-token", { status: 401 }),
    new Response("invalid"),
    new Response(JSON.stringify({ key: "wrong" })),
    new Response("null"),
  ]) {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(result);
    const connector = new OpenRouterOAuthConnector(transport);
    const f = flow(connector);
    await expect(connector.complete(f.state, "code", f.browser)).rejects.toMatchObject({
      code: "OPENROUTER_AUTH_REQUIRED",
    });
    await expect(connector.complete(f.state, "code", f.browser)).rejects.toThrow();
    expect(transport).toHaveBeenCalledOnce();
    expect(connector.connected()).toBe(false);
  }
});
it("disconnect or new authorization prevents an in-flight exchange from installing credentials", async () => {
  for (const replacement of [false, true]) {
    let release!: (response: Response) => void;
    const transport = vi.fn<typeof fetch>().mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const connector = new OpenRouterOAuthConnector(transport);
    const f = flow(connector);
    const pending = connector.complete(f.state, "code", f.browser);
    if (replacement) flow(connector);
    else connector.disconnect();
    release(new Response(JSON.stringify({ key: KEY })));
    await expect(pending).rejects.toThrow();
    expect(connector.connected()).toBe(false);
  }
});
