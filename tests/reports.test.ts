import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { analyzeRepository } from "../src/kernel.js";
import {
  buildIntegrityReports,
  checkIntegrityReports,
  writeIntegrityReports,
} from "../src/reports.js";

describe("integrity reports", () => {
  it("writes deterministic reports and detects stale output", async () => {
    const analysis = await analyzeRepository(process.cwd());
    const reports = buildIntegrityReports(analysis);
    const directory = await mkdtemp(path.join(tmpdir(), "architecture-knowledge-reports-"));
    const first = await writeIntegrityReports(directory, reports);
    const firstContents = await Promise.all(
      first.map((file) => readFile(path.join(directory, file), "utf8")),
    );
    await writeIntegrityReports(directory, reports);
    const secondContents = await Promise.all(
      first.map((file) => readFile(path.join(directory, file), "utf8")),
    );
    expect(secondContents).toEqual(firstContents);
    expect(await checkIntegrityReports(directory, reports)).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: "current" })]),
    );
    await writeFile(path.join(directory, first[0]!), "{}\n", "utf8");
    expect(await checkIntegrityReports(directory, reports)).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: "stale" })]),
    );
  });
});
