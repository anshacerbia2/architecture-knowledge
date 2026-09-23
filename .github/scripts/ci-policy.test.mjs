import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

import { assertMutationGate, changedPaths, mutationMode } from "./ci-policy.mjs";

const inventory = "generated/integrity/markdown-link-integrity.json";

test("only editorial PRs can omit mutation, including their link inventory", () => {
  for (const paths of [
    ["docs/report.md"],
    ["README.md", "ROADMAP.md"],
    ["docs/report.md", inventory],
  ]) {
    assert.equal(mutationMode("pull_request", paths), "docs-only");
  }
});

test("empty, malformed and non-PR changes require full mutation", () => {
  for (const paths of [[], null, undefined, [inventory], [42], [""]]) {
    assert.equal(mutationMode("pull_request", paths), "full");
  }
  for (const event of [
    "push",
    "schedule",
    "workflow_dispatch",
    "pull_request_target",
    "unknown",
    undefined,
  ]) {
    assert.equal(mutationMode(event, ["docs/report.md"]), "full");
  }
});

test("mixed and unknown changes cannot be hidden behind a documentation extension", () => {
  const paths = [
    "src/id-validator.ts",
    "tests/test.ts",
    "package.json",
    "pnpm-lock.yaml",
    "schemas/example.json",
    "ontology/types.yaml",
    "roadmap/implementation.yaml",
    "knowledge/data/example.md",
    "decisions/example.yaml",
    "claims/example.yaml",
    "sources/registry.yaml",
    "evaluation/golden.yaml",
    "validation/policies.yaml",
    "generated/graph/graph.json",
    ".github/workflows/validate.yml",
    ".github/scripts/ci-policy.mjs",
    "AGENTS.md",
    "docs/AGENTS.md",
    "docs/nested/agents.md",
    "docs/adr/0001.md",
    "docs/../src/example.md",
    "docs//report.md",
    "docs/./report.md",
    "docs\\report.md",
    "docs/report.md\nsrc/test.ts",
    "docs/report.md\0",
    "docs/evidence/run.log",
    "README.MD",
    "unknown.md",
    "docs/report.md.ts",
  ];
  for (const path of paths) {
    assert.equal(mutationMode("pull_request", ["docs/report.md", path]), "full", path);
  }
});

function needs(mode, result, classification = "success") {
  return {
    changes: { result: classification, outputs: { mutation_mode: mode } },
    "mutation-suite": { result },
  };
}

test("gate accepts successful full suites or explicitly omitted editorial PR suites", () => {
  for (const event of ["pull_request", "push", "schedule", "workflow_dispatch"]) {
    assert.match(
      assertMutationGate(event, needs("full", "success")),
      /seven mutation suites passed/,
    );
  }
  assert.match(
    assertMutationGate("pull_request", needs("docs-only", "skipped")),
    /intentionally omitted/,
  );
});

test("gate rejects failed, cancelled, absent and unexpectedly skipped dependencies", () => {
  for (const result of ["failure", "cancelled", "skipped", undefined, "", "neutral"]) {
    assert.throws(
      () => assertMutationGate("pull_request", needs("full", result)),
      /CI_MUTATION_GATE_FAILED/,
    );
  }
  for (const result of ["failure", "cancelled", "success", undefined]) {
    assert.throws(
      () => assertMutationGate("pull_request", needs("docs-only", result)),
      /CI_MUTATION_GATE_FAILED/,
    );
  }
  for (const result of ["failure", "cancelled", "skipped", undefined]) {
    const outcome = needs("full", "success");
    outcome.changes.result = result;
    assert.throws(() => assertMutationGate("pull_request", outcome), /CI_CLASSIFICATION_FAILED/);
  }
  for (const event of ["push", "schedule", "workflow_dispatch", undefined]) {
    assert.throws(
      () => assertMutationGate(event, needs("docs-only", "skipped")),
      /CI_MUTATION_GATE_FAILED/,
    );
  }
  for (const mode of [undefined, "", "false", "true", "editorial"]) {
    assert.throws(
      () => assertMutationGate("pull_request", needs(mode, "success")),
      /CI_MUTATION_GATE_FAILED/,
    );
  }
  assert.throws(() => assertMutationGate("pull_request", {}), /CI_CLASSIFICATION_FAILED/);
  assert.throws(() => assertMutationGate("pull_request", null), /CI_CLASSIFICATION_FAILED/);
});

test("real Git diff preserves both sides of renames, deleted code and spaces", () => {
  const directory = mkdtempSync(join(tmpdir(), "aks-ci-policy-"));
  const git = (...args) => execFileSync("git", args, { cwd: directory, encoding: "utf8" }).trim();
  try {
    git("init", "--quiet");
    git("config", "user.name", "Synthetic CI test");
    git("config", "user.email", "ci-test@example.invalid");
    git("config", "core.autocrlf", "false");
    mkdirSync(join(directory, "src"));
    mkdirSync(join(directory, "docs"));
    writeFileSync(join(directory, "src", "old.ts"), "synthetic fixture\n");
    git("add", ".");
    git("-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "fixture base");
    const base = git("rev-parse", "HEAD");
    renameSync(join(directory, "src", "old.ts"), join(directory, "docs", "new file.md"));
    git("add", "-A");
    git("-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "fixture rename");
    const head = git("rev-parse", "HEAD");
    const paths = changedPaths(base, head, directory);
    assert.deepEqual(paths.sort(), ["docs/new file.md", "src/old.ts"]);
    assert.equal(mutationMode("pull_request", paths), "full");
    assert.deepEqual(changedPaths(head, head, directory), []);
    assert.throws(() => changedPaths("--output=attack", head, directory), /CI_DIFF_SHA_INVALID/);
    assert.throws(() => changedPaths("0".repeat(40), head, directory));
    writeFileSync(join(directory, "docs", "new file.md"), "updated synthetic documentation\n");
    git("add", "-A");
    git("-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "fixture editorial change");
    const editorialHead = git("rev-parse", "HEAD");
    const outputPath = join(directory, "ci-output");
    const summaryPath = join(directory, "ci-summary");
    const scriptPath = fileURLToPath(new URL("./ci-policy.mjs", import.meta.url));
    const classified = spawnSync(process.execPath, [scriptPath, "classify"], {
      cwd: directory,
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: "pull_request",
        CI_BASE_SHA: head,
        CI_HEAD_SHA: editorialHead,
        GITHUB_OUTPUT: outputPath,
        GITHUB_STEP_SUMMARY: summaryPath,
      },
      encoding: "utf8",
    });
    assert.equal(classified.status, 0, classified.stderr);
    assert.equal(readFileSync(outputPath, "utf8"), "mutation_mode=docs-only\n");
    assert.match(readFileSync(summaryPath, "utf8"), /docs-only; changed paths: 1/);
    const gated = spawnSync(process.execPath, [scriptPath, "gate"], {
      cwd: directory,
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: "pull_request",
        CI_NEEDS: JSON.stringify(needs("docs-only", "skipped")),
        GITHUB_STEP_SUMMARY: summaryPath,
      },
      encoding: "utf8",
    });
    assert.equal(gated.status, 0, gated.stderr);
    assert.match(readFileSync(summaryPath, "utf8"), /intentionally omitted/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI exits nonzero for gate failure, malformed JSON and missing diff history", () => {
  for (const [command, env] of [
    ["gate", { CI_NEEDS: JSON.stringify(needs("full", "failure")) }],
    ["gate", { CI_NEEDS: "not json" }],
    ["classify", { CI_BASE_SHA: "", CI_HEAD_SHA: "" }],
    ["unknown", {}],
  ]) {
    const result = spawnSync(process.execPath, [".github/scripts/ci-policy.mjs", command], {
      env: { ...process.env, GITHUB_EVENT_NAME: "pull_request", ...env },
      encoding: "utf8",
    });
    assert.equal(result.status, 1, result.stderr);
  }
});

test("workflow retains seven real suites, evidence and a mandatory failure-aware gate", () => {
  const workflow = parse(readFileSync(".github/workflows/validate.yml", "utf8"));
  const jobs = workflow.jobs;
  const suite = jobs["mutation-suite"];
  const configs = [
    "stryker.config.json",
    "stryker.graph.config.json",
    "stryker.retrieval.config.json",
    "stryker.rag.config.json",
    "stryker.decision-guide.config.json",
    "stryker.decision-recommendation.config.json",
    "stryker.decision-runtime.config.json",
  ];
  assert.deepEqual(suite.strategy.matrix.include.map((row) => row.config).sort(), configs.sort());
  assert.equal(suite.strategy["fail-fast"], false);
  assert.equal(suite["continue-on-error"], undefined);
  assert.equal(suite.needs, "changes");
  assert.equal(suite.if, "${{ needs.changes.outputs.mutation_mode == 'full' }}");
  assert.ok(suite.steps.some((step) => step.run === "pnpm exec stryker run ${{ matrix.config }}"));
  for (const row of suite.strategy.matrix.include) {
    const config = JSON.parse(readFileSync(row.config, "utf8"));
    assert.equal(row.report, config.jsonReporter.fileName);
    assert.equal(config.thresholds.break, 60);
    assert.ok(config.mutate.length > 0);
  }
  const upload = suite.steps.find((step) => step.uses === "actions/upload-artifact@v4");
  assert.equal(upload.if, "${{ always() }}");
  assert.equal(upload.with["if-no-files-found"], "error");
  assert.equal(upload.with["include-hidden-files"], true);
  assert.deepEqual(jobs.mutation.needs, ["changes", "mutation-suite"]);
  assert.equal(jobs.mutation.if, "${{ always() }}");
  assert.ok(
    jobs.mutation.steps.some(
      (step) =>
        step.run === "node .github/scripts/ci-policy.mjs gate" &&
        step.env.CI_NEEDS === "${{ toJSON(needs) }}",
    ),
  );
  assert.deepEqual(workflow.on.push.branches, ["main"]);
  for (const event of ["pull_request", "workflow_dispatch", "schedule"])
    assert.ok(event in workflow.on);
  assert.equal(workflow.on.pull_request, null); // No workflow-level paths filter leaving required checks pending.
  assert.equal(
    workflow.concurrency["cancel-in-progress"],
    "${{ github.event_name == 'pull_request' }}",
  );
  assert.deepEqual(jobs.validate.strategy.matrix.os, ["ubuntu-latest", "windows-latest"]);
  assert.equal(jobs.validate.if, undefined);
  assert.equal(jobs["retrieval-integration"].if, undefined);
  assert.ok(jobs.validate.steps.some((step) => step.run === "pnpm test:ci"));
});
