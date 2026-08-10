import { isPlainObject } from "./io.js";
import {
  DEFAULT_GRAPH_DEPTH,
  MAX_CANDIDATE_K,
  MAX_GRAPH_DEPTH,
  MAX_QUERY_CHARACTERS,
  MAX_TOP_K,
} from "./retrieval-config.js";
import type {
  RetrievalFilters,
  RetrievalMode,
  RetrievalRequest,
  RetrievalUnitKind,
} from "./retrieval-types.js";

const MODES = new Set<RetrievalMode>(["lexical", "vector", "hybrid", "hybrid-graph"]);
const UNIT_KINDS = new Set<RetrievalUnitKind>([
  "concept-overview",
  "concept-section",
  "claim",
  "relationship",
  "source",
]);
const TOP_LEVEL = new Set([
  "text",
  "mode",
  "top_k",
  "candidate_k",
  "filters",
  "graph",
  "budget",
  "explain",
  "allow_degraded_lexical_fallback",
]);
const FILTER_KEYS = new Set([
  "concept_types",
  "domains",
  "statuses",
  "claim_types",
  "semantic_scopes",
  "minimum_confidence",
  "normative_forces",
  "unit_kinds",
]);

export function parseRetrievalRequest(input: unknown): RetrievalRequest {
  if (!isPlainObject(input)) fail("query must be an object");
  rejectUnknown(input, TOP_LEVEL, "query");
  const text = requiredString(input.text, "text");
  if (!text.trim()) fail("text must not be empty");
  if (text.length > MAX_QUERY_CHARACTERS) fail(`text exceeds ${MAX_QUERY_CHARACTERS} characters`);
  const mode = (input.mode ?? "hybrid") as RetrievalMode;
  if (typeof mode !== "string" || !MODES.has(mode)) fail(`unsupported mode '${String(mode)}'`);
  const topK = integer(input.top_k ?? 10, 1, MAX_TOP_K, "top_k");
  const candidateK = integer(input.candidate_k ?? 40, topK, MAX_CANDIDATE_K, "candidate_k");
  return {
    text,
    mode,
    top_k: topK,
    candidate_k: candidateK,
    filters: parseFilters(input.filters),
    graph: parseGraph(input.graph, mode),
    budget: parseBudget(input.budget, topK),
    explain: optionalBoolean(input.explain, true, "explain"),
    allow_degraded_lexical_fallback: optionalBoolean(
      input.allow_degraded_lexical_fallback,
      false,
      "allow_degraded_lexical_fallback",
    ),
  };
}

function parseFilters(value: unknown): RetrievalFilters {
  if (value === undefined) return emptyFilters();
  if (!isPlainObject(value)) fail("filters must be an object");
  rejectUnknown(value, FILTER_KEYS, "filters");
  const unitKinds = stringArray(value.unit_kinds, "filters.unit_kinds") as RetrievalUnitKind[];
  if (unitKinds.some((kind) => !UNIT_KINDS.has(kind)))
    fail("filters.unit_kinds contains an unknown kind");
  const minimum = value.minimum_confidence;
  if (
    minimum !== undefined &&
    minimum !== null &&
    !["low", "medium", "high"].includes(String(minimum))
  )
    fail("filters.minimum_confidence must be low, medium, high, or null");
  return {
    concept_types: stringArray(value.concept_types, "filters.concept_types"),
    domains: stringArray(value.domains, "filters.domains"),
    statuses: stringArray(value.statuses, "filters.statuses"),
    claim_types: stringArray(value.claim_types, "filters.claim_types"),
    semantic_scopes: stringArray(value.semantic_scopes, "filters.semantic_scopes"),
    minimum_confidence: typeof minimum === "string" ? minimum : null,
    normative_forces: stringArray(value.normative_forces, "filters.normative_forces"),
    unit_kinds: unitKinds,
  };
}

function parseGraph(value: unknown, mode: RetrievalMode): RetrievalRequest["graph"] {
  if (value !== undefined && !isPlainObject(value)) fail("graph must be an object");
  const object = isPlainObject(value) ? value : {};
  rejectUnknown(object, new Set(["enabled", "max_depth", "predicates"]), "graph");
  const enabled = optionalBoolean(object.enabled, mode === "hybrid-graph", "graph.enabled");
  const maxDepth = integer(
    object.max_depth ?? DEFAULT_GRAPH_DEPTH,
    0,
    MAX_GRAPH_DEPTH,
    "graph.max_depth",
  );
  if (mode !== "hybrid-graph" && enabled) fail("graph expansion requires hybrid-graph mode");
  return {
    enabled,
    max_depth: maxDepth,
    predicates: stringArray(object.predicates, "graph.predicates"),
  };
}

function parseBudget(value: unknown, topK: number): RetrievalRequest["budget"] {
  if (value !== undefined && !isPlainObject(value)) fail("budget must be an object");
  const object = isPlainObject(value) ? value : {};
  rejectUnknown(
    object,
    new Set(["max_units", "max_estimated_tokens", "max_units_per_concept"]),
    "budget",
  );
  return {
    max_units: integer(object.max_units ?? topK, 1, MAX_TOP_K, "budget.max_units"),
    max_estimated_tokens: integer(
      object.max_estimated_tokens ?? 4000,
      1,
      100_000,
      "budget.max_estimated_tokens",
    ),
    max_units_per_concept: integer(
      object.max_units_per_concept ?? 3,
      1,
      MAX_TOP_K,
      "budget.max_units_per_concept",
    ),
  };
}

function emptyFilters(): RetrievalFilters {
  return {
    concept_types: [],
    domains: [],
    statuses: [],
    claim_types: [],
    semantic_scopes: [],
    minimum_confidence: null,
    normative_forces: [],
    unit_kinds: [],
  };
}

function rejectUnknown(
  object: Record<string, unknown>,
  permitted: ReadonlySet<string>,
  label: string,
): void {
  const unknown = Object.keys(object)
    .filter((key) => !permitted.has(key))
    .sort();
  if (unknown.length > 0) fail(`${label} has unsupported field '${unknown[0]}'`);
}

function stringArray(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    fail(`${label} must be a string array`);
  return [...new Set(value as string[])].sort();
}

function optionalBoolean(value: unknown, fallback: boolean, label: string): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") fail(`${label} must be a boolean`);
  return value;
}

function integer(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum)
    fail(`${label} must be an integer from ${minimum} to ${maximum}`);
  return Number(value);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  return value;
}

function fail(message: string): never {
  throw new Error(`RETRIEVAL_QUERY_SHAPE ${message}`);
}
