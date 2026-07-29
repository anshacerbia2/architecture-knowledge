import process from "node:process";

import {
  formatDiagnostic,
  hasErrors,
  sortDiagnostics,
  summarizeDiagnostics,
} from "./diagnostics.js";
import {
  analyzeRepository,
  diagnosticsFor,
  validationCategories,
  type ValidationCategory,
} from "./kernel.js";
import { buildIntegrityReports, checkIntegrityReports, writeIntegrityReports } from "./reports.js";

const root = process.cwd();
const [command = "validate", argument] = process.argv.slice(2);

try {
  const analysis = await analyzeRepository(root);
  if (command === "validate") {
    const categories =
      argument === undefined
        ? validationCategories
        : validationCategories.includes(argument as ValidationCategory)
          ? [argument as ValidationCategory]
          : undefined;
    if (!categories) {
      throw new Error(
        `Unknown validation category '${argument}'. Expected ${validationCategories.join(", ")}.`,
      );
    }
    const diagnostics = sortDiagnostics(diagnosticsFor(analysis, categories));
    for (const item of diagnostics) {
      console.log(formatDiagnostic(item));
    }
    const summary = summarizeDiagnostics(diagnostics);
    console.log(
      `Validation ${categories.join(",")}: ${summary.errors} error(s), ${summary.warnings} warning(s).`,
    );
    const policy = analysis.model.ontology.validationPolicies.diagnostics;
    const blockingWarningCodes = new Set(
      typeof policy === "object" &&
        policy !== null &&
        "blocking_warning_codes" in policy &&
        Array.isArray(policy.blocking_warning_codes)
        ? policy.blocking_warning_codes.filter((code): code is string => typeof code === "string")
        : [],
    );
    const hasBlockingWarning = diagnostics.some(
      (item) => item.severity === "warning" && blockingWarningCodes.has(item.code),
    );
    process.exitCode = hasErrors(diagnostics) || hasBlockingWarning ? 1 : 0;
  } else if (command === "report" && argument === "write") {
    const diagnostics = sortDiagnostics(diagnosticsFor(analysis));
    if (hasErrors(diagnostics)) {
      for (const item of diagnostics) console.log(formatDiagnostic(item));
      throw new Error("Integrity reports were not written because validation failed.");
    }
    const written = await writeIntegrityReports(root, buildIntegrityReports(analysis));
    console.log(`Wrote ${written.length} deterministic integrity report(s).`);
  } else if (command === "report" && argument === "check") {
    const checks = await checkIntegrityReports(root, buildIntegrityReports(analysis));
    const changed = checks.filter((check) => check.status !== "current");
    for (const check of changed) {
      console.log(`${check.status.toUpperCase()} ${check.path}`);
    }
    console.log(
      `Integrity report check: ${checks.length - changed.length}/${checks.length} current.`,
    );
    process.exitCode = changed.length > 0 ? 1 : 0;
  } else {
    throw new Error("Usage: cli.ts validate [category] | report write | report check");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
