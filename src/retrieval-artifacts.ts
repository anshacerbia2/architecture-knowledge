import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { hasErrors, sortDiagnostics, formatDiagnostic } from "./diagnostics.js";
import {
  checkGraphArtifacts,
  loadCurrentGraph,
  validateGraphArtifacts,
} from "./graph-artifacts.js";
import { buildGraphArtifacts } from "./graph-projector.js";
import type { GraphArtifacts } from "./graph-types.js";
import { diagnosticsFor, analyzeRepository } from "./kernel.js";
import { asArray, asString, isPlainObject } from "./io.js";
import { buildRetrievalArtifacts } from "./retrieval-units.js";
import {
  RETRIEVAL_CONTRACT_VERSION,
  type RetrievalArtifacts,
  type RetrievalManifest,
  type RetrievalUnit,
} from "./retrieval-types.js";

export interface RetrievalArtifactCheck {
  path: string;
  status: "current" | "missing" | "stale";
}

export async function expectedRetrievalArtifacts(root: string): Promise<RetrievalArtifacts> {
  return buildRetrievalArtifacts(await loadValidatedGraph(root));
}

export async function loadValidatedGraph(root: string): Promise<GraphArtifacts> {
  const analysis = await analyzeRepository(root);
  const repositoryDiagnostics = sortDiagnostics(diagnosticsFor(analysis));
  if (hasErrors(repositoryDiagnostics)) {
    for (const item of repositoryDiagnostics) console.error(formatDiagnostic(item));
    throw new Error("RETRIEVAL_INPUT_INVALID Repository validation must pass.");
  }
  const expectedGraph = buildGraphArtifacts(analysis.model);
  const graphDiagnostics = validateGraphArtifacts(analysis.model, expectedGraph);
  if (graphDiagnostics.length > 0) {
    throw new Error(`RETRIEVAL_GRAPH_INVALID ${graphDiagnostics.length} diagnostic(s).`);
  }
  const graphChecks = await checkGraphArtifacts(root, expectedGraph);
  if (graphChecks.some((item) => item.status !== "current")) {
    throw new Error("RETRIEVAL_GRAPH_NOT_CURRENT");
  }
  return loadCurrentGraph(root, expectedGraph);
}

export async function writeRetrievalArtifacts(
  root: string,
  artifacts: RetrievalArtifacts,
): Promise<string[]> {
  const written: string[] = [];
  for (const [relative, contents] of artifacts.files) {
    const absolute = path.join(root, relative);
    const temporary = `${absolute}.tmp`;
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(temporary, contents, "utf8");
    await rm(absolute, { force: true });
    await rename(temporary, absolute);
    written.push(relative);
  }
  return written.sort();
}

export async function checkRetrievalArtifacts(
  root: string,
  artifacts: RetrievalArtifacts,
): Promise<RetrievalArtifactCheck[]> {
  const checks: RetrievalArtifactCheck[] = [];
  for (const [relative, expected] of artifacts.files) {
    try {
      const actual = await readFile(path.join(root, relative), "utf8");
      checks.push({ path: relative, status: actual === expected ? "current" : "stale" });
    } catch (error) {
      const code = isPlainObject(error) ? asString(error.code) : undefined;
      if (code !== "ENOENT") throw error;
      checks.push({ path: relative, status: "missing" });
    }
  }
  return checks.sort((left, right) => left.path.localeCompare(right.path));
}

export async function loadCurrentRetrievalArtifacts(
  root: string,
  expected: RetrievalArtifacts,
): Promise<RetrievalArtifacts> {
  const checks = await checkRetrievalArtifacts(root, expected);
  const changed = checks.filter((item) => item.status !== "current");
  if (changed.length > 0) {
    throw new Error(
      `RETRIEVAL_UNITS_NOT_CURRENT ${changed.map((item) => `${item.status}:${item.path}`).join(",")}`,
    );
  }
  const unitsDocument = parseDocument(
    await readFile(path.join(root, "generated/retrieval/units.json"), "utf8"),
    "generated/retrieval/units.json",
  );
  const manifestDocument = parseDocument(
    await readFile(path.join(root, "generated/retrieval/manifest.json"), "utf8"),
    "generated/retrieval/manifest.json",
  );
  if (
    unitsDocument.retrieval_contract_version !== RETRIEVAL_CONTRACT_VERSION ||
    manifestDocument.retrieval_contract_version !== RETRIEVAL_CONTRACT_VERSION
  ) {
    throw new Error(`RETRIEVAL_SCHEMA_VERSION expected ${RETRIEVAL_CONTRACT_VERSION}`);
  }
  return {
    units: asArray(unitsDocument.units) as RetrievalUnit[],
    manifest: manifestDocument as unknown as RetrievalManifest,
    files: expected.files,
  };
}

function parseDocument(contents: string, file: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents) as unknown;
  } catch (error) {
    throw new Error(
      `RETRIEVAL_ARTIFACT_READ ${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!isPlainObject(parsed)) throw new Error(`RETRIEVAL_ARTIFACT_SHAPE ${file}`);
  return parsed;
}
