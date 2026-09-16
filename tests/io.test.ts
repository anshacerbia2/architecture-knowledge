import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { relativePath, walkFiles } from "../src/io.js";

describe("repository file discovery", () => {
  it("keeps app source documentation but excludes build and browser artifacts", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "aks-workspace-walk-"));
    for (const directory of [
      "dist",
      "apps/atlas/dist",
      "apps/atlas/test-results",
      "apps/atlas/playwright-report",
    ]) {
      await mkdir(path.join(root, directory), { recursive: true });
      await writeFile(path.join(root, directory, "artifact.md"), "[generated](missing.md)");
    }
    await writeFile(path.join(root, "apps/atlas/README.md"), "Workspace source documentation");
    expect((await walkFiles(root)).map((file) => relativePath(root, file))).toEqual([
      "apps/atlas/README.md",
    ]);
  });
  it("ignores Stryker sandboxes so mutation fixtures cannot enter validation", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "aks-walk-"));
    await mkdir(path.join(root, ".stryker-tmp", "sandbox", "tests"), { recursive: true });
    await writeFile(
      path.join(root, ".stryker-tmp", "sandbox", "tests", "invalid.md"),
      "[bad](missing.md)",
      "utf8",
    );
    await writeFile(path.join(root, "visible.md"), "visible", "utf8");
    const files = (await walkFiles(root)).map((file) => relativePath(root, file));
    expect(files).toEqual(["visible.md"]);
  });
});
