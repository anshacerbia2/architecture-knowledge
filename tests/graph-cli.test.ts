import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";

describe("M4 graph CLI contract", () => {
  const temporaryFiles = new Set<string>();

  afterEach(async () => {
    await Promise.all([...temporaryFiles].map((file) => rm(file, { force: true })));
    temporaryFiles.clear();
  });

  it("returns stable JSON for a successful query", () => {
    const result = run("get", "AKC-000018");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ graph_contract_version: 1, result_count: 1 });
  });

  it("accepts source and target positionals for a path query", () => {
    const result = run("path", "AKC-000008", "AKC-000016", "--max-depth", "4");
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout) as {
      result_count: number;
      results: Array<{ node_ids: string[]; relationship_ids: string[] }>;
    };
    expect(output.result_count).toBe(1);
    expect(output.results[0]?.node_ids).toEqual(["AKC-000008", "AKC-000010", "AKC-000016"]);
    expect(output.results[0]?.relationship_ids).toEqual(["AKR-000004", "AKR-000012"]);
  });

  it("rejects an extra positional after the path target", () => {
    const result = run("path", "AKC-000008", "AKC-000016", "AKC-000010");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "GRAPH_ARGUMENT_UNKNOWN Unexpected positional argument 'AKC-000010'.",
    );
  });

  it("returns non-zero for an unknown ID without a stack trace", () => {
    const result = run("get", "AKC-999999");
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).diagnostics[0].code).toBe("GRAPH_ID_UNKNOWN");
    expect(result.stderr).not.toContain(" at ");
  });

  it("rejects an invalid direction deterministically", () => {
    const result = run("neighbors", "AKC-000018", "--direction", "sideways");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("GRAPH_DIRECTION_INVALID");
  });

  it("rejects invalid depth deterministically", () => {
    const result = run("traverse", "AKC-000018", "--max-depth", "99");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("GRAPH_DEPTH_INVALID");
  });

  it("rejects an unsupported filter deterministically", () => {
    const result = run("list", "concepts", "--fuzzy", "oidc");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("GRAPH_FILTER_UNSUPPORTED");
  });

  it("rejects malformed query JSON deterministically", async () => {
    const file = path.join(tmpdir(), `aks-malformed-query-${process.pid}.json`);
    temporaryFiles.add(file);
    await writeFile(file, "{", "utf8");
    const result = run("query", "--file", file);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("GRAPH_QUERY_FILE");
  });

  it("rejects mutually conflicting traversal flags", () => {
    const result = run("neighbors", "AKC-000018", "--include-excluded", "--traversable-only");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("GRAPH_FLAG_CONFLICT");
  });
});

function run(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, ["--import", "tsx", "src/graph-cli.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}
