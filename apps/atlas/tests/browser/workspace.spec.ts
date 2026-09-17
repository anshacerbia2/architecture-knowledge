import { test, expect } from "@playwright/test";
import { KNOWLEDGE_ID_PATTERN } from "../../packages/contracts/src/index.js";

test("live pilot disclosures show budget and public egress without making live calls", async ({
  page,
}) => {
  // UI transport fixture, not live-provider or billing evidence.
  await page.route("**/api/v1/status", async (route) => {
    await route.fulfill({
      json: {
        contract_version: 1,
        request_id: "synthetic-status",
        repository_commit: "synthetic-sha",
        data: {
          repository_commit: "synthetic-sha",
          graph: "ready",
          retrieval: "unavailable",
          retrieval_code: "RETRIEVAL_GENERATION_MISSING",
          generation_id: null,
          database_mode: "hosted",
          counts: {},
          provider_mode: "openai-live-pilot",
          recommendations_enabled: false,
          pilot_budget: {
            limit_cents: 500,
            reserved_cents: 51,
            remaining_cents: 449,
            expires_at: "2026-10-01T00:00:00.000Z",
          },
        },
      },
    });
  });
  await page.goto("/status");
  await expect(page.getByRole("link", { name: "PROVIDER STATUS" })).toBeVisible();
  await expect(page.getByText("DETERMINISTIC DEMO", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "OpenAI live pilot" })).toBeVisible();
  await expect(page.getByText(/Reserved \$0.51 \/ \$5.00/)).toBeVisible();
  await expect(page.getByText(/pnpm app:pilot index/)).toBeVisible();
  await page.goto("/ask");
  await expect(
    page.getByText(/submitting sends your question and retrieved public evidence/),
  ).toBeVisible();
});

test("every real identifier family is accepted, including AKL claims", async ({
  request,
  page,
}) => {
  const catalog = (await (await request.get("/api/v1/catalog")).json()).data as {
    id: string;
    family: string;
  }[];
  const selected = new Map<string, string>();
  for (const record of catalog) {
    expect(record.id).toMatch(new RegExp(KNOWLEDGE_ID_PATTERN));
    selected.set(record.family, record.id);
  }
  expect([...selected.keys()].sort()).toEqual([
    "claim",
    "concept",
    "decision-guide",
    "relationship",
    "source",
  ]);
  for (const id of selected.values())
    expect((await request.get(`/api/v1/records/${id}`)).status()).toBe(200);
  await page.goto(`/records/${selected.get("claim")}`);
  await expect(page.getByRole("heading", { name: "Record & evidence" })).toBeVisible();
});

test("real graph catalog, record, provenance and local status", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Understand the architecture." })).toBeVisible();
  await page.getByRole("textbox", { name: "Search knowledge" }).fill("AKC-000012");
  await page.locator(".record-card").click();
  await expect(page.getByRole("heading", { name: "Record & evidence" })).toBeVisible();
  await page.getByRole("link", { name: "Explore connections" }).click();
  await expect(page.getByRole("img", { name: "One-hop connections for AKC-000012" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connection details" })).toBeVisible();
  await page.getByRole("link", { name: "System status" }).click();
  await expect(page.getByRole("heading", { name: "Ready to explore" })).toBeVisible();
  await page.getByText("Request provenance", { exact: true }).click();
  await expect(page.getByText("Knowledge commit", { exact: true }).last()).toBeVisible();
  expect(errors).toEqual([]);
});

test("API rejects cross-origin requests and unknown answer fields", async ({ request }) => {
  const bad = await request.get("/api/v1/bootstrap", {
    headers: { origin: "https://evil.example" },
  });
  expect(bad.status()).toBe(403);
  const bootstrap = await (await request.get("/api/v1/bootstrap")).json();
  const response = await request.post("/api/v1/rag/answers", {
    headers: { "x-app-token": bootstrap.data.token },
    data: {
      question: "retry",
      data_classification: "public",
      allow_recommendations: true,
    },
  });
  expect(response.status()).toBe(400);
});

test("single-turn answer UI displays safe citations and qualifiers; clear removes result", async ({
  page,
}) => {
  // Transport fixture only: not database/runtime/provider evidence.
  await page.route("**/api/v1/rag/answers", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      question: "What is a circuit breaker?",
      data_classification: "public",
    });
    await route.fulfill({
      json: {
        contract_version: 1,
        request_id: "synthetic-request",
        repository_commit: "synthetic-sha",
        data: {
          question: "What is a circuit breaker?",
          status: "answered",
          summary: "Synthetic UI test answer.",
          uncertainties: ["Context matters."],
          refusal_reason: null,
          model_invoked: true,
          provider: { provider: "test", model: "test", prompt_version: 1 },
          provenance: {
            context_fingerprint: "test",
            retrieval_generation_id: "test",
            graph_input_fingerprint: "test",
            retrieval_manifest_root: "test",
            data_classification: "public",
          },
          statements: [
            {
              statement_id: "s1",
              text: "<script>window.injected=true</script>",
              epistemic_type: "sourced-claim",
              confidence: "medium",
              claim_ids: [],
              evidence_ids: ["E1"],
              conditions: ["Synthetic condition"],
              alternatives: ["Synthetic alternative"],
              trade_offs: ["Synthetic cost"],
              citations: [
                {
                  citation_id: "c1",
                  evidence_id: "E1",
                  source_id: "AKS-000001",
                  title: "Synthetic source",
                  url: "https://example.com",
                  locators: [],
                },
              ],
            },
          ],
        },
      },
    });
  });
  await page.goto("/ask");
  await page.getByRole("button", { name: "What is a circuit breaker?", exact: true }).click();
  await page.getByRole("button", { name: "Ask knowledge", exact: false }).click();
  await expect(page.getByText("Synthetic UI test answer.")).toBeVisible();
  await expect(page.getByText("Synthetic condition", { exact: true })).toBeVisible();
  await expect(page.locator(".statement script")).toHaveCount(0);
  await page.getByText("AKS-000001 · Synthetic source", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Open registered source" })).toHaveAttribute(
    "rel",
    "noreferrer noopener",
  );
  await page.getByRole("button", { name: "Clear question & answer" }).click();
  await expect(page.getByText("Synthetic UI test answer.")).toHaveCount(0);
});

test("mobile navigation and no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".record-card").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Ask knowledge" }).click();
  await expect(
    page.getByRole("textbox", { name: "What would you like to understand?" }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("actual retrieval readiness is honored, never replaced with fake success", async ({
  request,
}) => {
  const status = (await (await request.get("/api/v1/status")).json()).data;
  const token = (await (await request.get("/api/v1/bootstrap")).json()).data.token;
  const response = await request.post("/api/v1/search", {
    headers: { "x-app-token": token },
    data: { text: "retry", mode: "hybrid-graph" },
  });
  if (status.retrieval === "ready") {
    expect(response.status()).toBe(200);
    expect((await response.json()).data.generation_id).toBe(status.generation_id);
  } else {
    expect([409, 503]).toContain(response.status());
    expect((await response.json()).data).toBeUndefined();
  }
});

test("visual checkpoints on desktop and mobile", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".record-card").first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("explore-desktop.png"),
    fullPage: true,
  });
  await page.goto("/graph?id=AKC-000012");
  await expect(page.getByRole("heading", { name: "Connection details" })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("graph-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ask");
  await expect(
    page.getByRole("textbox", { name: "What would you like to understand?" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("ask-mobile.png"),
    fullPage: true,
  });
});
