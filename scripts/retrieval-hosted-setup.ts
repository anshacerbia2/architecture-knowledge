import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const envFile = path.join(root, "apps", "atlas", ".env");

if (!existsSync(envFile)) {
  console.error("RETRIEVAL_SETUP_ENV_MISSING: create apps/atlas/.env first.");
  process.exit(1);
}

loadEnvFile(envFile);
if (process.env.RETRIEVAL_DATABASE_MODE !== "hosted") {
  console.error("RETRIEVAL_SETUP_HOSTED_REQUIRED: set RETRIEVAL_DATABASE_MODE=hosted.");
  process.exit(1);
}

const databaseUrl = process.env.RETRIEVAL_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl?.trim()) {
  console.error("RETRIEVAL_SETUP_DATABASE_URL_MISSING: set DATABASE_URL in apps/atlas/.env.");
  process.exit(1);
}

const windows = process.platform === "win32";
const command = windows ? (process.env.ComSpec ?? "cmd.exe") : "pnpm";
const environment = {
  ...process.env,
  RETRIEVAL_DATABASE_URL: databaseUrl,
  RETRIEVAL_EMBEDDING_PROVIDER: "fake",
};

for (const step of ["retrieval:migrate", "retrieval:index", "retrieval:check"]) {
  const args = windows ? ["/d", "/s", "/c", `pnpm ${step}`] : [step];
  const result = spawnSync(command, args, {
    cwd: root,
    env: environment,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) {
    console.error(`RETRIEVAL_SETUP_FAILED: ${step} could not start.`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`RETRIEVAL_SETUP_FAILED: ${step} returned a non-zero status.`);
    process.exit(result.status ?? 1);
  }
}

console.log("Hosted retrieval setup complete: migration, index and currentness check passed.");
