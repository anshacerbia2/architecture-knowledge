import { readFile } from "node:fs/promises";

import type { RetrievalMode } from "./retrieval-types.js";

export async function parseRetrievalCliQuery(arguments_: readonly string[]): Promise<unknown> {
  const args = [...arguments_];
  if (args[0] === "--") args.shift();
  const flags = new Map<string, string[]>();
  let text: string | undefined;
  while (args.length > 0) {
    const value = args.shift();
    if (!value) break;
    if (!value.startsWith("--")) {
      if (text !== undefined) throw new Error(`RETRIEVAL_ARGUMENT_UNKNOWN Unexpected '${value}'.`);
      text = value;
      continue;
    }
    const key = value.slice(2);
    if (key === "json" || key === "allow-degraded-lexical-fallback") {
      flags.set(key, []);
      continue;
    }
    const flagValue = args.shift();
    if (!flagValue || flagValue.startsWith("--")) {
      throw new Error(`RETRIEVAL_FLAG_VALUE Missing value for --${key}.`);
    }
    flags.set(key, [...(flags.get(key) ?? []), flagValue]);
  }
  const permitted = new Set([
    "text",
    "file",
    "mode",
    "top-k",
    "candidate-k",
    "concept-type",
    "domain",
    "status",
    "claim-type",
    "semantic-scope",
    "minimum-confidence",
    "normative-force",
    "unit-kind",
    "graph-depth",
    "graph-predicate",
    "max-units",
    "max-tokens",
    "max-units-per-concept",
    "json",
    "allow-degraded-lexical-fallback",
  ]);
  for (const key of flags.keys()) {
    if (!permitted.has(key)) throw new Error(`RETRIEVAL_FILTER_UNSUPPORTED --${key}`);
  }
  const file = single(flags, "file");
  if (file) {
    if (text !== undefined || flags.size !== 1) {
      throw new Error("RETRIEVAL_FLAG_CONFLICT --file cannot be combined with inline options.");
    }
    try {
      return JSON.parse(await readFile(file, "utf8")) as unknown;
    } catch (error) {
      throw new Error(
        `RETRIEVAL_QUERY_FILE ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  const flaggedText = single(flags, "text");
  if (flaggedText && text !== undefined) {
    throw new Error("RETRIEVAL_FLAG_CONFLICT --text cannot be combined with positional text.");
  }
  text = flaggedText ?? text;
  if (!text) throw new Error("RETRIEVAL_ARGUMENT_REQUIRED Missing query text.");
  const mode = (single(flags, "mode") ?? "hybrid") as RetrievalMode;
  const graphDepth = numberFlag(flags, "graph-depth");
  return {
    text,
    mode,
    ...optionalNumber(flags, "top-k", "top_k"),
    ...optionalNumber(flags, "candidate-k", "candidate_k"),
    filters: {
      concept_types: flags.get("concept-type") ?? [],
      domains: flags.get("domain") ?? [],
      statuses: flags.get("status") ?? [],
      claim_types: flags.get("claim-type") ?? [],
      semantic_scopes: flags.get("semantic-scope") ?? [],
      minimum_confidence: single(flags, "minimum-confidence") ?? null,
      normative_forces: flags.get("normative-force") ?? [],
      unit_kinds: flags.get("unit-kind") ?? [],
    },
    graph: {
      enabled: mode === "hybrid-graph",
      ...(graphDepth === undefined ? {} : { max_depth: graphDepth }),
      predicates: flags.get("graph-predicate") ?? [],
    },
    budget: {
      ...optionalNumber(flags, "max-units", "max_units"),
      ...optionalNumber(flags, "max-tokens", "max_estimated_tokens"),
      ...optionalNumber(flags, "max-units-per-concept", "max_units_per_concept"),
    },
    explain: true,
    allow_degraded_lexical_fallback: flags.has("allow-degraded-lexical-fallback"),
  };
}

function optionalNumber(flags: Map<string, string[]>, key: string, output: string) {
  const value = numberFlag(flags, key);
  return value === undefined ? {} : { [output]: value };
}

function single(flags: Map<string, string[]>, key: string): string | undefined {
  const values = flags.get(key) ?? [];
  if (values.length > 1) throw new Error(`RETRIEVAL_FLAG_REPEAT --${key}`);
  return values[0];
}

function numberFlag(flags: Map<string, string[]>, key: string): number | undefined {
  const value = single(flags, key);
  return value === undefined ? undefined : Number(value);
}
