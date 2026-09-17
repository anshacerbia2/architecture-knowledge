import { afterEach, expect, it, vi } from "vitest";
import path from "node:path";
import { createServer } from "../apps/api/src/http-server.js";
import { KnowledgeService } from "../packages/application/src/knowledge-service.js";
import { fakePort } from "./fixture.js";
import {
  OpenRouterOAuthConnector,
  OpenRouterApiConnector,
} from "../packages/ai-connectors/src/openrouter-connectors.js";

const KEY = `sk-or-v1-${"synthetic".repeat(5)}`;
const open: Awaited<ReturnType<typeof createServer>>[] = [];
afterEach(async () => {
  await Promise.all(open.splice(0).map((app) => app.close()));
});
async function setup(api = false) {
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify({ key: KEY })));
  const connector = api ? new OpenRouterApiConnector(KEY) : new OpenRouterOAuthConnector(transport);
  const app = await createServer(new KnowledgeService(fakePort()), { port: 4310, connector });
  open.push(app);
  const host = { host: "127.0.0.1:4310" };
  const bootstrap = await app.inject({ url: "/api/v1/bootstrap", headers: host });
  const headers = {
    ...host,
    origin: "http://127.0.0.1:4310",
    "x-app-token": bootstrap.json().data.token,
  };
  return { app, connector, transport, host, headers };
}
it("protects connect/disconnect with local host/origin/token checks and strict bodies", async () => {
  const { app, headers, host, transport } = await setup();
  for (const url of [
    "/api/v1/connectors/openrouter/start",
    "/api/v1/connectors/openrouter/disconnect",
  ]) {
    expect((await app.inject({ method: "POST", url, headers: host, payload: {} })).statusCode).toBe(
      403,
    );
    expect(
      (
        await app.inject({
          method: "POST",
          url,
          headers: { ...headers, origin: "https://evil.invalid" },
          payload: {},
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "POST",
          url,
          headers,
          payload: { callback: "https://evil.invalid" },
        })
      ).statusCode,
    ).toBe(400);
  }
  expect(transport).not.toHaveBeenCalled();
});
it("completes only the browser-bound one-time cross-site navigation and returns no secrets", async () => {
  const { app, headers, host, transport, connector } = await setup();
  const start = await app.inject({
    method: "POST",
    url: "/api/v1/connectors/openrouter/start",
    headers,
    payload: {},
  });
  expect(start.statusCode).toBe(200);
  expect(start.body).not.toContain(KEY);
  expect(start.json().data.browser).toBeUndefined();
  const cookie = String(start.headers["set-cookie"]);
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Lax");
  const callback = new URL(
    new URL(start.json().data.authorization_url).searchParams.get("callback_url")!,
  );
  const url = `${callback.pathname}?code=synthetic-code`;
  const nav = {
    ...host,
    "sec-fetch-site": "cross-site",
    "sec-fetch-mode": "navigate",
    cookie: cookie.split(";")[0]!,
  };
  expect((await app.inject({ url, headers: { ...nav, cookie: "" } })).statusCode).toBe(401);
  expect(
    (await app.inject({ url, headers: { ...nav, "sec-fetch-mode": "cors" } })).statusCode,
  ).toBe(403);
  expect((await app.inject({ url: "/api/v1/catalog", headers: nav })).statusCode).toBe(403);
  expect(transport).not.toHaveBeenCalled();
  const done = await app.inject({ url, headers: nav });
  expect(done.statusCode).toBe(303);
  expect(done.headers.location).toBe("/status");
  expect(done.body).not.toContain(KEY);
  expect(done.headers["referrer-policy"]).toBe("no-referrer");
  expect(String(done.headers["set-cookie"])).toContain("Max-Age=0");
  expect(connector.connected()).toBe(true);
  expect((await app.inject({ url, headers: nav })).statusCode).toBe(401);
  const disconnect = await app.inject({
    method: "POST",
    url: "/api/v1/connectors/openrouter/disconnect",
    headers,
    payload: {},
  });
  expect(disconnect.statusCode).toBe(200);
  expect(connector.connected()).toBe(false);
});
it("API mode cannot initiate OAuth; malformed callbacks cannot exchange credentials", async () => {
  const api = await setup(true);
  for (const action of ["start", "disconnect"])
    expect(
      (
        await api.app.inject({
          method: "POST",
          url: `/api/v1/connectors/openrouter/${action}`,
          headers: api.headers,
          payload: {},
        })
      ).statusCode,
    ).toBe(409);
  const { app, host, transport } = await setup();
  for (const url of [
    "/api/v1/connectors/openrouter/callback/bad?code=x",
    `/api/v1/connectors/openrouter/callback/${"a".repeat(64)}?code=x&code=y`,
  ])
    expect((await app.inject({ url, headers: host })).statusCode).toBe(400);
  expect(transport).not.toHaveBeenCalled();
});

it("allows only the connected OAuth document landing while cross-site APIs remain denied", async () => {
  const connector = new OpenRouterOAuthConnector(
    async () => new Response(JSON.stringify({ key: KEY })),
  );
  const app = await createServer(new KnowledgeService(fakePort()), {
    port: 4310,
    connector,
    staticRoot: path.resolve("tests"),
  });
  open.push(app);
  app.get("/status", async (_req, reply) =>
    reply.type("text/html").send("<html>Public shell</html>"),
  );
  const nav = {
    host: "127.0.0.1:4310",
    "sec-fetch-site": "cross-site",
    "sec-fetch-mode": "navigate",
    "sec-fetch-dest": "document",
  };
  expect((await app.inject({ url: "/status", headers: nav })).statusCode).toBe(403);
  const flow = connector.begin("http://127.0.0.1:4310");
  const callback = new URL(new URL(flow.authorization_url).searchParams.get("callback_url")!);
  await connector.complete(callback.pathname.split("/").at(-1)!, "synthetic", flow.browser);
  for (const headers of [nav, { ...nav, origin: "https://openrouter.ai" }]) {
    const response = await app.inject({ url: "/status", headers });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).not.toContain(KEY);
  }
  for (const url of ["/api/v1/status", "/api/v1/bootstrap", "/ask", "/status?unexpected=true"]) {
    expect((await app.inject({ url, headers: nav })).statusCode).toBe(403);
  }
  for (const headers of [
    { ...nav, "sec-fetch-mode": "cors" },
    { ...nav, "sec-fetch-dest": "iframe" },
    { ...nav, origin: "https://evil.invalid" },
  ])
    expect((await app.inject({ url: "/status", headers })).statusCode).toBe(403);
  expect((await app.inject({ method: "POST", url: "/status", headers: nav })).statusCode).toBe(403);
  connector.disconnect();
  expect((await app.inject({ url: "/status", headers: nav })).statusCode).toBe(403);
});
