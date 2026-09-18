import path from "node:path";
import { test, expect } from "@playwright/test";
import { createServer } from "../../apps/api/src/http-server.js";
import { KnowledgeService } from "../../packages/application/src/knowledge-service.js";
import { OpenRouterOAuthConnector } from "../../packages/ai-connectors/src/openrouter-connectors.js";
import { fakePort, status } from "../fixture.js";

test("OAuth callback redirects through cross-site navigation to a connected status page", async ({
  page,
}) => {
  // Real browser + HTTP server, synthetic provider exchange; no external credential or API call.
  const connector = new OpenRouterOAuthConnector(
    async () => new Response(JSON.stringify({ key: `sk-or-v1-${"synthetic".repeat(5)}` })),
  );
  const origin = "http://127.0.0.1:4323";
  const app = await createServer(
    new KnowledgeService(
      fakePort({
        status: async () => ({
          ...status,
          provider_mode: "openrouter-free",
          ai_connection: { mode: "oauth", connected: connector.connected() },
        }),
      }),
    ),
    { port: 4323, connector, staticRoot: path.resolve("dist/web") },
  );
  const landingSites: unknown[] = [];
  app.addHook("onResponse", async (req) => {
    if (req.url === "/status") landingSites.push(req.headers["sec-fetch-site"]);
  });
  await app.listen({ host: "127.0.0.1", port: 4323 });
  try {
    await page.route("https://openrouter.ai/auth?*", async (route) => {
      const callback = new URL(new URL(route.request().url()).searchParams.get("callback_url")!);
      expect(callback.origin).toBe(origin);
      callback.searchParams.set("code", "synthetic-code");
      await route.fulfill({
        contentType: "text/html",
        body: `<a href="${callback.href}">Authorize synthetic account</a>`,
      });
    });
    await page.route("https://entry.example/", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<a href="${origin}/status">Open Atlas status</a>`,
      }),
    );
    await page.goto("https://entry.example/");
    await page.getByRole("link", { name: "Open Atlas status" }).click();
    await expect(
      page.getByText("Account connection (OAuth PKCE): Not connected.", { exact: true }),
    ).toBeVisible();
    expect(landingSites).toContain("cross-site");
    landingSites.length = 0;
    await page.getByRole("button", { name: "Connect OpenRouter" }).click();
    await page.getByRole("link", { name: "Authorize synthetic account" }).click();
    await expect(
      page.getByText("Account connection (OAuth PKCE): Connected.", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(`${origin}/status`);
    expect(landingSites).toContain("cross-site");
    expect(connector.connected()).toBe(true);

    const nav = {
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
    };
    for (const route of ["/api/v1/bootstrap", "/api/v1/status", "/api/v1/catalog", "/ask"]) {
      expect((await page.request.get(`${origin}${route}`, { headers: nav })).status()).toBe(403);
    }
    for (const headers of [
      { ...nav, "sec-fetch-mode": "cors" },
      { ...nav, "sec-fetch-dest": "iframe" },
      { ...nav, origin: "https://evil.invalid" },
    ])
      expect((await page.request.get(`${origin}/status`, { headers })).status()).toBe(403);
    expect((await page.request.post(`${origin}/status`, { headers: nav, data: {} })).status()).toBe(
      403,
    );
    connector.disconnect();
    expect((await page.request.get(`${origin}/status`, { headers: nav })).status()).toBe(200);
  } finally {
    await app.close();
  }
});
