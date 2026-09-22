import { test, expect } from "@playwright/test";

test("real decision API evaluates all three pinned guides with the database unavailable", async ({
  request,
}) => {
  const status = (await (await request.get("/api/v1/status")).json()).data;
  expect(status.retrieval).toBe("unavailable");
  const bootstrap = (await (await request.get("/api/v1/bootstrap")).json()).data;
  const catalog = await (await request.get("/api/v1/decision-guides")).json();
  expect(catalog.data.map((item: { id: string }) => item.id)).toEqual([
    "AKG-000001",
    "AKG-000002",
    "AKG-000003",
  ]);
  const exclusions: Record<string, string[]> = {
    "AKG-000001": [
      "Independent deployment within the selected scope is mandatory and cannot be met by one primary deployable.",
      "The system is distributed into services without adequate resilience, observability, delivery, or ownership capability.",
    ],
    "AKG-000002": [
      "The current operation is not safely repeatable or no attempts fit its deadline and load budget.",
      "No acceptable caller response exists while the breaker blocks dependency calls.",
    ],
    "AKG-000003": [
      "Premise examination would be the sole lens and required cross-boundary analysis would remain unaddressed.",
      "Interaction analysis would be the sole lens and a material uncertain premise would remain unexamined.",
    ],
  };
  for (const guide of catalog.data) {
    const intake = await (await request.get(`/api/v1/decision-guides/${guide.id}/intake`)).json();
    const session = {
      contract_version: 3,
      session_id: "55555555-5555-4555-8555-555555555555",
      guide_id: guide.id,
      guide_version: guide.version,
      context: intake.data.context_variables.map((item: { key: string; sensitivity: string }) => ({
        key: item.key,
        value: "Synthetic browser test project",
        classification: item.sensitivity,
        provenance: "human-provided",
        confirmed_by_human: true,
      })),
      drivers: [],
      constraints: intake.data.constraints.map((item: { concept_id: string }) => ({
        concept_id: item.concept_id,
        satisfied: true,
        notes: null,
      })),
      condition_evaluations: intake.data.conditions.map(
        (item: { condition: { statement: string } }) => ({
          condition: item.condition,
          satisfied: !exclusions[guide.id]!.includes(item.condition.statement),
          confirmed_by_human: true,
        }),
      ),
      privacy: {
        persistence: "ephemeral-only",
        external_provider_authorized: false,
        external_provider_authorization: null,
        redacted_keys: [],
      },
      authority: {
        recommendation_only: true,
        human_decision_required: true,
        automation_may_approve: false,
      },
    };
    const result = await request.post("/api/v1/decision-evaluations", {
      headers: { "x-app-token": bootstrap.token },
      data: { repository_commit: catalog.repository_commit, client_revision: 2, session },
    });
    expect(result.status()).toBe(200);
    expect(result.headers()["cache-control"]).toBe("no-store");
    const output = (await result.json()).data;
    expect(output.client_revision).toBe(2);
    expect(output.recommendation.status).toBe("multiple-viable-options");
    expect(output.recommendation.viable_options).toEqual(guide.option_ids);
    expect(output.recommendation.authority.automation_may_approve).toBe(false);
    expect(output.recommendation.evidence_claims.length).toBeGreaterThan(0);
  }
});

test("real browser intake confirms evidence, invalidates edits and discards sessions", async ({
  page,
}, testInfo) => {
  await page.goto("/decide");
  await page.getByLabel("Decision guide", { exact: true }).selectOption("AKG-000002");
  await expect(page.locator(".condition-card")).toHaveCount(7);
  await page.getByRole("button", { name: "Evaluate options" }).click();
  await expect(page.getByRole("heading", { name: "needs human clarification" })).toBeVisible();
  for (const input of await page.locator("textarea").all())
    await input.fill("Synthetic bounded dependency decision");
  for (const confirm of await page
    .getByRole("checkbox", { name: /I confirm this project context/ })
    .all())
    await confirm.check();
  await page.getByRole("combobox", { name: "Assessment", exact: true }).selectOption("true");
  for (const card of await page.locator(".condition-card").all()) {
    const statement = await card.locator("legend").innerText();
    const excluded =
      statement.startsWith("The current operation is not") ||
      statement.startsWith("No acceptable caller response");
    await card.getByRole("radio", { name: excluded ? "No" : "Yes", exact: true }).check();
    await card.getByRole("checkbox", { name: "I confirm this assessment." }).check();
  }
  await page.getByRole("button", { name: "Evaluate options" }).click();
  await expect(page.getByRole("heading", { name: "multiple viable options" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("decision-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("decision-mobile.png"), fullPage: true });
  expect(
    await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })),
  ).toEqual({ local: {}, session: {} });
  await page.locator("textarea").first().fill("Revised synthetic decision");
  await expect(page.locator(".decision-result")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset ephemeral session" }).click();
  await expect(page.locator("textarea").first()).toHaveValue("");
  await page.locator("textarea").first().fill("Discard on guide change");
  await page.getByLabel("Decision guide", { exact: true }).selectOption("AKG-000003");
  await expect(page.locator("textarea").first()).toHaveValue("");
  await page.locator("textarea").first().fill("Discard on reload");
  await page.reload();
  await expect(page.locator("textarea").first()).toHaveValue("");
});

for (const action of ["edit", "reset", "guide", "navigate"] as const) {
  test(`obsolete decision response cannot reappear after ${action}`, async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let captured!: () => void;
    const received = new Promise<void>((resolve) => {
      captured = resolve;
    });
    await page.route("**/api/v1/decision-evaluations", async (route) => {
      const result = await route.fetch();
      captured();
      await gate;
      await route.fulfill({ response: result }).catch(() => {}); // Navigation may cancel this request.
    });
    await page.goto("/decide");
    await page.getByRole("button", { name: "Evaluate options" }).click();
    await received;
    if (action === "edit") await page.locator("textarea").first().fill("New revision");
    else if (action === "reset")
      await page.getByRole("button", { name: "Reset ephemeral session" }).click();
    else if (action === "guide")
      await page.getByLabel("Decision guide", { exact: true }).selectOption("AKG-000002");
    else await page.getByRole("link", { name: "Ask knowledge" }).click();
    release();
    await expect(page.locator(".decision-result")).toHaveCount(0);
    await expect(page.locator(".working")).toHaveCount(0);
  });
}
