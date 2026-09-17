import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, it } from "vitest";
import { cleanCommit, immutableCopy } from "../packages/knowledge-adapter/src/snapshot.js";

it("detaches and freezes nested records, arrays and artifact map values", () => {
  const shared = { value: "original", nullable: null };
  const source = { items: [shared, shared], files: new Map([["key", { value: "map-only" }]]) };
  const snapshot = immutableCopy(source);
  shared.value = "changed";
  expect(snapshot.items[0]!.value).toBe("original");
  expect(() => {
    snapshot.items[0]!.value = "changed";
  }).toThrow(TypeError);
  expect(() => {
    snapshot.items.push(shared);
  }).toThrow(TypeError);
  expect(Object.isFrozen(snapshot.files.get("key"))).toBe(true);
});

it("detects dirty and untracked files in an isolated disposable Git repository", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "atlas-snapshot-test-"));
  const execute = promisify(execFile);
  try {
    await execute("git", ["init"], { cwd: root, windowsHide: true });
    await execute(
      "git",
      [
        "-c",
        "user.name=Synthetic Test",
        "-c",
        "user.email=test@example.invalid",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "--allow-empty",
        "-m",
        "Synthetic test only",
      ],
      { cwd: root, windowsHide: true },
    );
    expect(await cleanCommit(root)).toMatch(/^[a-f0-9]{40}$/);
    await writeFile(path.join(root, "synthetic.txt"), "Untracked change");
    await expect(cleanCommit(root)).rejects.toMatchObject({
      code: "SNAPSHOT_CHANGED",
    });
  } finally {
    if (
      path.dirname(root) !== path.resolve(os.tmpdir()) ||
      !path.basename(root).startsWith("atlas-snapshot-test-")
    )
      throw new Error("Unsafe test cleanup");
    await rm(root, { recursive: true, force: true });
  }
});
