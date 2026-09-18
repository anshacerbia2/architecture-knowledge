import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import path from "node:path";
import os from "node:os";
import { appRoot } from "../apps/api/src/config.js";
import { AgyProcess } from "../packages/ai-connectors/src/agy-process.js";
import { AppError } from "../packages/application/src/errors.js";

if (existsSync(path.join(appRoot, ".env"))) loadEnvFile(path.join(appRoot, ".env"));
try {
  const executable =
    process.env.ATLAS_AGY_EXECUTABLE ??
    (process.platform === "win32" ? path.join(os.homedir(), "AppData/Local/agy/bin/agy.exe") : "");
  await new AgyProcess(executable).probe();
  console.log(
    "AGY_RUNNER_PASSED: a small public cloud prompt returned valid structured output. This consumes CLI quota; architecture answer quality is not measured by this check.",
  );
} catch (e) {
  console.error(e instanceof AppError ? `${e.code}: ${e.message}` : "AGY_CHECK_FAILED");
  process.exitCode = 1;
}
