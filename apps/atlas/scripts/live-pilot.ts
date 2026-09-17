import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { appRoot, configuration } from "../apps/api/src/config.js";
import { PilotBudget } from "../packages/knowledge-adapter/src/pilot-budget.js";
import { pilotIndex, pilotManifest } from "../packages/knowledge-adapter/src/pilot-index.js";
import { OPENROUTER_FREE_MODEL } from "../packages/knowledge-adapter/src/openrouter-provider.js";

if (existsSync(path.join(appRoot, ".env"))) loadEnvFile(path.join(appRoot, ".env"));
const command = process.argv.slice(2).filter((arg) => arg !== "--");
try {
  if (
    command.length !== 1 ||
    !["plan", "init-budget", "budget", "index", "check"].includes(command[0]!)
  )
    throw new Error("PILOT_USAGE_plan_init-budget_budget_index_check");
  const action = command[0]!;
  const budget = new PilotBudget(path.join(appRoot, ".tmp/live-pilot/budget.txt"));
  if (action === "init-budget") {
    if (process.env.ATLAS_LIVE_CONSENT !== "public-only-usd5")
      throw new Error("PILOT_CONSENT_REQUIRED");
    budget.initialize();
    console.log(JSON.stringify(budget.status(), null, 2));
  } else if (action === "budget") {
    console.log(JSON.stringify(budget.status(), null, 2));
  } else if (action === "plan") {
    const config = configuration({ ...process.env, ATLAS_PROVIDER_MODE: "fake" });
    const { commit, artifacts } = await pilotManifest(config.repoRoot);
    console.log(
      JSON.stringify(
        {
          repository_commit: commit,
          unit_count: artifacts.units.length,
          public_manifest_to_review: artifacts.manifest.manifest_root_hash,
          embedding_model:
            process.env.ATLAS_PROVIDER_MODE === "openrouter-free"
              ? "token-hash-v1 (stored only; lexical retrieval)"
              : "text-embedding-3-small",
          answer_model:
            process.env.ATLAS_PROVIDER_MODE === "openrouter-free"
              ? OPENROUTER_FREE_MODEL
              : "gpt-5.6-sol",
          network_calls: 0,
        },
        null,
        2,
      ),
    );
  } else {
    const config = configuration(process.env);
    console.log(
      JSON.stringify(
        await pilotIndex(
          config.repoRoot,
          config.databaseUrl,
          config.databaseMode === "hosted",
          config.provider,
          action as "index" | "check",
        ),
        null,
        2,
      ),
    );
  }
} catch {
  // Never emit raw DB/provider/config exceptions, which may contain credentials or input data.
  console.error(
    "PILOT_OPERATION_FAILED: check clean checkout, configuration, consent, budget and database. See apps/atlas/docs/live-provider-pilot.md.",
  );
  process.exitCode = 1;
}
