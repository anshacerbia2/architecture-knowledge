import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { describe, expect, it } from "vitest";

const exec = promisify(execFile);
describe("decision validation CLI privacy and argument boundary", () => {
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
