import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const markdownInventory = "generated/integrity/markdown-link-integrity.json";

function editorialMarkdown(path) {
  if (typeof path !== "string" || /[\\\r\n\0]/.test(path)) return false;
  const segments = path.split("/");
  if (segments.some((part) => !part || part === "." || part === "..")) return false;
  if (segments.at(-1).toLowerCase() === "agents.md") return false;
  if (path.startsWith("docs/adr/")) return false;
  return path === "README.md" || path === "ROADMAP.md" || /^docs\/.+\.md$/.test(path);
}

// Unknown events, empty diffs and non-editorial paths retain full mutation.
export function mutationMode(event, paths) {
  if (event !== "pull_request" || !Array.isArray(paths) || paths.length === 0) return "full";
  return paths.some(editorialMarkdown) &&
    paths.every((path) => editorialMarkdown(path) || path === markdownInventory)
    ? "docs-only"
    : "full";
}

export function changedPaths(base, head, cwd = process.cwd()) {
  if (![base, head].every((sha) => typeof sha === "string" && /^[a-f0-9]{40}$/.test(sha))) {
    throw new Error("CI_DIFF_SHA_INVALID");
  }
  // No rename detection: both the removed and added paths must be considered.
  // NUL delimiters preserve spaces/newlines; argv avoids shell interpretation.
  const output = execFileSync(
    "git",
    ["diff", "--name-only", "--no-renames", "-z", `${base}...${head}`, "--"],
    { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
  );
  return output.split("\0").filter(Boolean);
}

export function assertMutationGate(event, needs) {
  if (needs?.changes?.result !== "success") throw new Error("CI_CLASSIFICATION_FAILED");
  const mode = needs.changes.outputs?.mutation_mode;
  const result = needs["mutation-suite"]?.result;
  if (mode === "full" && result === "success") return "All six mutation suites passed.";
  if (event === "pull_request" && mode === "docs-only" && result === "skipped") {
    return "Editorial-only PR: mutation intentionally omitted; validation and integration still required.";
  }
  throw new Error(`CI_MUTATION_GATE_FAILED mode=${String(mode)} result=${String(result)}`);
}

function report(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const command = process.argv[2];
    if (command === "classify") {
      let paths = [];
      if (process.env.GITHUB_EVENT_NAME === "pull_request") {
        paths = changedPaths(process.env.CI_BASE_SHA, process.env.CI_HEAD_SHA);
      }
      const mode = mutationMode(process.env.GITHUB_EVENT_NAME, paths);
      if (process.env.GITHUB_OUTPUT)
        appendFileSync(process.env.GITHUB_OUTPUT, `mutation_mode=${mode}\n`);
      report(`Mutation policy: ${mode}; changed paths: ${paths.length}.`);
    } else if (command === "gate") {
      report(
        assertMutationGate(process.env.GITHUB_EVENT_NAME, JSON.parse(process.env.CI_NEEDS ?? "{}")),
      );
    } else {
      throw new Error("CI_COMMAND_UNKNOWN");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
