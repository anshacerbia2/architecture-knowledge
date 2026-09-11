import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { loadRepository } from "../src/model.js";
import { outputScenario } from "./m7-2-output-helpers.js";

const exec = promisify(execFile);
describe("decision validation CLI privacy and argument boundary", () => {
  it("validates v4 applicability end-to-end and rejects forged targets without persisting or echoing inputs", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "aks-decision-v4-test-"));
    const sessionPath = path.join(directory, "session.json");
    const outputPath = path.join(directory, "recommendation.json");
    try {
      const f = outputScenario(await loadRepository(process.cwd()), 2, [0]);
      const serializedSession = JSON.stringify(f.session);
      await writeFile(sessionPath, serializedSession);
      await writeFile(outputPath, JSON.stringify(f.output));
      const args = [
        path.resolve("node_modules/tsx/dist/cli.mjs"),
        "src/decision-validation-cli.ts",
        "--",
        sessionPath,
        outputPath,
      ];
      const accepted = await exec(process.execPath, args);
      expect(JSON.parse(accepted.stdout)).toEqual({
        validation_only: true,
        passed: true,
        diagnostics: [],
      });
      expect(accepted.stderr).toBe("");
      expect(await readFile(outputPath, "utf8")).toBe(JSON.stringify(f.output));
      f.output.tradeoffs[0]!.option_ids = ["AKC-000013"];
      await writeFile(outputPath, JSON.stringify(f.output));
      const rejected = await exec(process.execPath, args).then(
        () => null,
        (error: { code: number; stdout: string; stderr: string }) => error,
      );
      expect(rejected?.code).toBe(1);
      expect(JSON.parse(rejected!.stdout)).toMatchObject({
        validation_only: true,
        passed: false,
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ code: "DR_STATEMENT_OPTION" }),
        ]),
      });
      expect(rejected!.stdout).not.toContain("Synthetic bounded");
      expect(rejected!.stdout).not.toContain(directory);
      expect(rejected!.stderr).toBe("");
      expect(await readFile(sessionPath, "utf8")).toBe(serializedSession);
      expect(await readFile(outputPath, "utf8")).toBe(JSON.stringify(f.output));
      expect((await readdir(directory)).sort()).toEqual(["recommendation.json", "session.json"]);
    } finally {
      // Only this test's freshly allocated temporary directory, never a repository path.
      await rm(directory, { recursive: true, force: true });
    }
  }, 30000);
  it.each([
    { args: [] },
    { args: ["--", "sensitive-missing-session.json", "private-missing-output.json"] },
    { args: ["one", "two", "three"] },
  ])("rejects invalid invocation without echoing values: $args", async ({ args }) => {
    const failure = await exec(process.execPath, [
      path.resolve("node_modules/tsx/dist/cli.mjs"),
      "src/decision-validation-cli.ts",
      ...args,
    ]).then(
      () => null,
      (error: { code: number; stdout: string; stderr: string }) => error,
    );
    expect(failure).toMatchObject({
      code: 1,
      stdout: "",
      stderr: expect.stringContaining("DECISION_VALIDATION_FAILED"),
    });
    const stderr = failure!.stderr;
    expect(stderr).not.toContain("sensitive-missing-session");
    expect(stderr).not.toContain("private-missing-output");
  });
});
