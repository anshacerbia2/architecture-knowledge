import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "../apps/api/src/http-server.js";
import { KnowledgeService } from "../packages/application/src/knowledge-service.js";
import { AppError } from "../packages/application/src/errors.js";
import { fakePort } from "./fixture.js";
import type { KnowledgePort } from "../packages/application/src/knowledge-port.js";
import path from "node:path";

const open: Awaited<ReturnType<typeof createServer>>[] = [];
const host = { host: "127.0.0.1:4310" };
afterEach(async () => {
  await Promise.all(open.splice(0).map((app) => app.close()));
});
async function setup(port: Partial<KnowledgePort> = {}, staticRoot?: string) {
  const app = await createServer(new KnowledgeService(fakePort(port)), {
    port: 4310,
    staticRoot,
  });
  open.push(app);
  const bootstrap = await app.inject({
    url: "/api/v1/bootstrap",
    headers: host,
  });
  const headers = {
    ...host,
    "x-app-token": bootstrap.json().data.token,
    origin: "http://127.0.0.1:4310",
  };
  return { app, headers };
}
describe("local HTTP boundary", () => {
  it("returns provenance, security headers and unique request IDs", async () => {
    const { app } = await setup();
    for (const url of [
      "/api/v1/catalog",
      "/api/v1/records/AKC-000012",
      "/api/v1/graph/AKC-000012",
      "/api/v1/status",
      "/health/ready",
    ]) {
      const response = await app.inject({
        url,
        headers: { ...host, "x-request-id": "forged" },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().repository_commit).toBe("a".repeat(40));
      expect(response.json().request_id).not.toBe("forged");
      expect(response.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
      expect(response.headers["cache-control"]).toBe("no-store");
    }
    expect((await app.inject({ url: "/health/live", headers: host })).json()).toEqual({
      live: true,
    });
  });
  it.each([
    { host: "attacker.example:4310" },
    { ...host, origin: "https://evil.example" },
    { ...host, "sec-fetch-site": "cross-site" },
    { ...host, origin: "null" },
  ])("rejects foreign browser contexts %j", async (headers) => {
    const { app } = await setup();
    expect((await app.inject({ url: "/api/v1/bootstrap", headers })).statusCode).toBe(403);
  });
  it.each([undefined, "wrong", "é".repeat(64), "0".repeat(64)])(
    "rejects missing/forged token %s",
    async (token) => {
      const { app } = await setup();
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/search",
        headers: { ...host, ...(token ? { "x-app-token": token } : {}) },
        payload: { text: "retry", mode: "hybrid" },
      });
      expect(response.statusCode).toBe(403);
    },
  );
  it.each([
    { question: "", data_classification: "public" },
    { question: "  ", data_classification: "public" },
    { question: "x".repeat(4001), data_classification: "public" },
    { question: 42, data_classification: "public" },
    { question: "retry", data_classification: "secret" },
    {
      question: "retry",
      data_classification: "public",
      allow_recommendations: true,
    },
    { question: "retry", data_classification: "public", provider: "openai" },
    { question: "retry", data_classification: "public", messages: [] },
  ])("strictly rejects invalid answer body %j", async (payload) => {
    const { app, headers } = await setup();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/rag/answers",
      headers,
      payload,
    });
    expect(response.statusCode).toBe(400);
  });
  it("rejects invalid IDs, modes, oversize and invalid JSON", async () => {
    const { app, headers } = await setup();
    expect((await app.inject({ url: "/api/v1/records/not-an-id", headers })).statusCode).toBe(400);
    for (const payload of [
      { text: "retry", mode: "shell" },
      { text: "retry", mode: "hybrid", sql: "DROP TABLE x" },
    ]) {
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/api/v1/search",
            headers,
            payload,
          })
        ).statusCode,
      ).toBe(400);
    }
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/search",
          headers,
          payload: { text: "x".repeat(70000), mode: "hybrid" },
        })
      ).statusCode,
    ).toBe(413);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/search",
          headers: { ...headers, "content-type": "application/json" },
          payload: "{",
        })
      ).statusCode,
    ).toBe(400);
  });
  it("returns complete results through both POST routes", async () => {
    const { app, headers } = await setup();
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/search",
          headers,
          payload: { text: "retry", mode: "hybrid" },
        })
      ).statusCode,
    ).toBe(200);
    const answer = await app.inject({
      method: "POST",
      url: "/api/v1/rag/answers",
      headers,
      payload: { question: "retry", data_classification: "public" },
    });
    expect(answer.json().data.status).toBe("answered");
  });
  it("does not turn technical failures into insufficient-evidence answers or leak secrets", async () => {
    const { app, headers } = await setup({
      ask: async () => {
        throw new Error("postgres://user:secret@host private question");
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/rag/answers",
      headers,
      payload: { question: "retry", data_classification: "public" },
    });
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain("secret");
    expect(response.body).not.toContain("private question");
    expect(response.json().data).toBeUndefined();
  });
  it("preserves safe operational errors and readiness degradation", async () => {
    const { app } = await setup({
      record: async () => {
        throw new AppError("NOT_FOUND", 404, "Missing record.");
      },
      status: async () => ({
        ...(await fakePort().status()),
        graph: "stale",
        retrieval: "unavailable",
      }),
    });
    expect(
      (await app.inject({ url: "/api/v1/records/AKC-999999", headers: host })).statusCode,
    ).toBe(404);
    expect((await app.inject({ url: "/health/ready", headers: host })).statusCode).toBe(503);
    expect((await app.inject({ url: "/health/live", headers: host })).statusCode).toBe(200);
  });
  it("serves built SPA deep links, never disguises missing API/assets as HTML", async () => {
    const { app } = await setup({}, path.resolve("dist/web"));
    expect((await app.inject({ url: "/ask", headers: host })).headers["content-type"]).toContain(
      "text/html",
    );
    for (const url of ["/api/v1/missing", "/health/missing", "/assets/missing.js"])
      expect((await app.inject({ url, headers: host })).statusCode).toBe(404);
  });
});
