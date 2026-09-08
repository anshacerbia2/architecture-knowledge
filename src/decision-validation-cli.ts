import { readFile } from "node:fs/promises";
import { analyzeRepository, diagnosticsFor } from "./kernel.js";
import { validateDecisionRecommendation } from "./decision-recommendation-validator.js";
import { hasErrors } from "./diagnostics.js";

try {
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  if (args.length !== 2) throw new Error("DECISION_VALIDATION_USAGE");
  const analysis = await analyzeRepository(process.cwd());
  if (hasErrors(diagnosticsFor(analysis))) throw new Error("DECISION_REPOSITORY_INVALID");
  const session: unknown = JSON.parse(await readFile(args[0]!, "utf8"));
  const recommendation: unknown = JSON.parse(await readFile(args[1]!, "utf8"));
  const diagnostics = await validateDecisionRecommendation(analysis.model, session, recommendation);
  // No values, session contents, or filesystem paths in console diagnostics.
  console.log(
    JSON.stringify({
      validation_only: true,
      passed: !hasErrors(diagnostics),
      diagnostics: diagnostics.map(({ code, severity, pointer }) => ({ code, severity, pointer })),
    }),
  );
  process.exitCode = hasErrors(diagnostics) ? 1 : 0;
} catch {
  console.error(
    "DECISION_VALIDATION_FAILED Usage: pnpm decision:validate -- session.json recommendation.json (JSON files; no inputs are persisted).",
  );
  process.exitCode = 1;
}
