import { readFile } from "node:fs/promises";
import process from "node:process";

import { hasErrors, sortDiagnostics, formatDiagnostic } from "./diagnostics.js";
import {
  checkGraphArtifacts,
  loadCommittedGraph,
  validateGraphArtifacts,
  writeGraphArtifacts,
} from "./graph-artifacts.js";
import { buildGraphArtifacts, serializeGraphValue } from "./graph-projector.js";
import { GraphQueryEngine, type GraphDirection, type TraverseOptions } from "./graph-query.js";
import { diagnosticsFor, analyzeRepository } from "./kernel.js";
import { asArray, isPlainObject } from "./io.js";

const root = process.cwd();

try {
  const args = process.argv.slice(2);
  const command = args.shift();
  if (command === "generate" || command === "check") {
    if (args.length > 0) throw new Error(`GRAPH_ARGUMENT_UNKNOWN Unexpected '${args[0]}'.`);
    const analysis = await analyzeRepository(root);
    const repositoryDiagnostics = sortDiagnostics(diagnosticsFor(analysis));
    if (
      hasErrors(repositoryDiagnostics) ||
      hasBlockingWarning(analysis.model.ontology.validationPolicies, repositoryDiagnostics)
    ) {
      for (const item of repositoryDiagnostics) console.error(formatDiagnostic(item));
      throw new Error(
        "GRAPH_INPUT_INVALID Repository validation must pass before graph projection.",
      );
    }
    const artifacts = buildGraphArtifacts(analysis.model);
    const graphDiagnostics = validateGraphArtifacts(analysis.model, artifacts);
    if (graphDiagnostics.length > 0) {
      for (const item of graphDiagnostics) {
        console.error(`${item.code} ${item.path}: ${item.message}`);
      }
      throw new Error(`GRAPH_VALIDATION_FAILED ${graphDiagnostics.length} graph diagnostic(s).`);
    }
    if (command === "generate") {
      const written = await writeGraphArtifacts(root, artifacts);
      console.log(`Generated ${written.length} deterministic graph artifact(s).`);
    } else {
      const checks = await checkGraphArtifacts(root, artifacts);
      const changed = checks.filter((item) => item.status !== "current");
      for (const item of changed) console.error(`${item.status.toUpperCase()} ${item.path}`);
      console.log(
        `Graph artifact check: ${checks.length - changed.length}/${checks.length} current.`,
      );
      if (changed.length > 0) process.exitCode = 1;
    }
  } else {
    const graph = await loadCommittedGraph(root);
    const engine = new GraphQueryEngine(graph);
    const output = await runQuery(engine, command, args);
    console.log(serializeGraphValue(output));
    const diagnostics = isPlainObject(output) ? asArray(output.diagnostics) : [];
    if (diagnostics.some((item) => isPlainObject(item) && item.code !== "GRAPH_QUERY_EMPTY")) {
      process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function runQuery(
  engine: GraphQueryEngine,
  command: string | undefined,
  args: string[],
): Promise<unknown> {
  if (!command) throw new Error(usage());
  if (command === "get") return engine.get(requiredPositional(args, "record ID"));
  if (command === "neighbors") {
    const identifier = requiredPositional(args, "concept ID");
    const options = parseTraversalFlags(args, false);
    return engine.neighbors(identifier, options);
  }
  if (command === "traverse") {
    const identifier = requiredPositional(args, "concept ID");
    return engine.traverse(identifier, parseTraversalFlags(args, true));
  }
  if (command === "path") {
    const from = requiredPositional(args, "source concept ID", true);
    const to = requiredPositional(args, "target concept ID");
    return engine.paths(from, to, parseTraversalFlags(args, true));
  }
  if (command === "claims") {
    const identifier = requiredPositional(args, "concept ID");
    return engine.claimsForConcept(identifier, parseFilterFlags(args, claimFilterFlags()));
  }
  if (command === "evidence") return engine.evidenceForClaim(requiredPositional(args, "claim ID"));
  if (command === "explain")
    return engine.explainRelationship(requiredPositional(args, "relationship ID"));
  if (command === "dependents") return engine.dependents(requiredPositional(args, "record ID"));
  if (command === "list") {
    const family = requiredPositional(args, "index family");
    return engine.list(family, parseFilterFlags(args, listFilterFlags()[family] ?? {}));
  }
  if (command === "query") {
    const flags = parseRawFlags(args);
    assertOnlyFlags(flags, ["file"]);
    const file = oneFlag(flags, "file", true);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(file, "utf8")) as unknown;
    } catch (error) {
      throw new Error(
        `GRAPH_QUERY_FILE Invalid query file '${file}': ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return engine.structured(parsed);
  }
  throw new Error(`GRAPH_COMMAND_UNKNOWN Unknown command '${command}'.\n${usage()}`);
}

function parseTraversalFlags(args: string[], allowDepth: boolean): TraverseOptions {
  const flags = parseRawFlags(args);
  const permitted = [
    "direction",
    "predicate",
    "include-excluded",
    "traversable-only",
    ...(allowDepth ? ["max-depth", "concept-type", "domain"] : []),
  ];
  assertOnlyFlags(flags, permitted);
  if (flags.has("include-excluded") && flags.has("traversable-only")) {
    throw new Error(
      "GRAPH_FLAG_CONFLICT --include-excluded and --traversable-only cannot be combined.",
    );
  }
  const directionValue = oneFlag(flags, "direction", false) ?? (allowDepth ? "outgoing" : "both");
  if (!new Set(["outgoing", "incoming", "both"]).has(directionValue)) {
    throw new Error(`GRAPH_DIRECTION_INVALID Invalid direction '${directionValue}'.`);
  }
  const depthValue = oneFlag(flags, "max-depth", false);
  const maxDepth = depthValue === undefined ? undefined : Number(depthValue);
  return {
    direction: directionValue as GraphDirection,
    predicates: flags.get("predicate") ?? [],
    includeExcluded: flags.has("include-excluded"),
    ...(maxDepth === undefined ? {} : { maxDepth }),
    conceptTypes: flags.get("concept-type") ?? [],
    domains: flags.get("domain") ?? [],
  };
}

function claimFilterFlags(): Record<string, string> {
  return {
    "claim-type": "claim_type",
    status: "status",
    confidence: "confidence",
    "normative-force": "normative_force",
    source: "source",
    "semantic-scope": "semantic_scope",
  };
}

function listFilterFlags(): Record<string, Record<string, string>> {
  return {
    concepts: {
      type: "type",
      domain: "domain",
      status: "status",
      title: "title",
      "human-key": "human_key",
    },
    claims: {
      id: "id",
      subject: "subject",
      predicate: "predicate",
      object: "object",
      "claim-type": "claim_type",
      "semantic-scope": "semantic_scope",
      confidence: "confidence",
      status: "status",
      source: "source",
      "applicable-concept": "applicable_concept",
      "normative-force": "normative_force",
    },
    relationships: {
      id: "id",
      subject: "subject",
      object: "object",
      predicate: "predicate",
      status: "status",
      confidence: "confidence",
      "semantic-scope": "semantic_scope",
      "traversal-eligible": "traversal_eligible",
      "supporting-claim": "supporting_claim",
      source: "source",
    },
    sources: {
      id: "id",
      title: "title",
      "source-type": "source_type",
      status: "status",
      publisher: "publisher",
      authority: "authority",
      domain: "domain",
    },
  };
}

function parseFilterFlags(
  args: string[],
  mapping: Record<string, string>,
): Record<string, string[]> {
  const flags = parseRawFlags(args);
  assertOnlyFlags(flags, Object.keys(mapping));
  return Object.fromEntries(
    [...flags.entries()].map(([key, values]) => [mapping[key] ?? key, values]),
  );
}

function requiredPositional(
  args: string[],
  label: string,
  allowFollowingPositional = false,
): string {
  const value = args.shift();
  if (!value || value.startsWith("--"))
    throw new Error(`GRAPH_ARGUMENT_REQUIRED Missing ${label}.`);
  if (!allowFollowingPositional && args[0] && !args[0]?.startsWith("--")) {
    throw new Error(`GRAPH_ARGUMENT_UNKNOWN Unexpected positional argument '${args[0]}'.`);
  }
  return value;
}

function parseRawFlags(args: string[]): Map<string, string[]> {
  const output = new Map<string, string[]>();
  while (args.length > 0) {
    const raw = args.shift();
    if (!raw?.startsWith("--"))
      throw new Error(`GRAPH_ARGUMENT_UNKNOWN Unexpected '${String(raw)}'.`);
    const key = raw.slice(2);
    if (key === "include-excluded" || key === "traversable-only") {
      output.set(key, []);
      continue;
    }
    const value = args.shift();
    if (!value || value.startsWith("--"))
      throw new Error(`GRAPH_FLAG_VALUE Missing value for --${key}.`);
    output.set(key, [...(output.get(key) ?? []), value]);
  }
  return output;
}

function oneFlag(flags: Map<string, string[]>, key: string, required: true): string;
function oneFlag(flags: Map<string, string[]>, key: string, required: false): string | undefined;
function oneFlag(flags: Map<string, string[]>, key: string, required: boolean): string | undefined {
  const values = flags.get(key) ?? [];
  if (values.length > 1) throw new Error(`GRAPH_FLAG_REPEAT --${key} may appear once.`);
  const value = values[0];
  if (required && !value) throw new Error(`GRAPH_FLAG_REQUIRED --${key} is required.`);
  return value;
}

function assertOnlyFlags(flags: Map<string, string[]>, permitted: string[]): void {
  for (const key of flags.keys()) {
    if (!permitted.includes(key))
      throw new Error(`GRAPH_FILTER_UNSUPPORTED Unsupported flag '--${key}'.`);
  }
}

function hasBlockingWarning(
  policies: Record<string, unknown>,
  diagnostics: readonly { code: string; severity: string }[],
): boolean {
  const policy = isPlainObject(policies.diagnostics) ? policies.diagnostics : {};
  const blocking = new Set(
    asArray(policy.blocking_warning_codes).filter(
      (item): item is string => typeof item === "string",
    ),
  );
  return diagnostics.some((item) => item.severity === "warning" && blocking.has(item.code));
}

function usage(): string {
  return "Usage: graph <generate|check|get|neighbors|traverse|path|claims|evidence|explain|dependents|list|query>";
}
