import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { asArray, asString, asStringArray, isPlainObject } from "./io.js";
import type { RepositoryModel } from "./model.js";
import { relationshipTraversalDecision, serializeGraphValue } from "./graph-projector.js";
import {
  GRAPH_CONTRACT_VERSION,
  type GraphArtifacts,
  type GraphEdge,
  type GraphIndexRecord,
  type GraphNode,
  type GraphValidationDiagnostic,
} from "./graph-types.js";

export interface GraphArtifactCheck {
  path: string;
  status: "current" | "missing" | "stale";
}

export async function writeGraphArtifacts(
  root: string,
  artifacts: GraphArtifacts,
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

export async function checkGraphArtifacts(
  root: string,
  artifacts: GraphArtifacts,
): Promise<GraphArtifactCheck[]> {
  const checks: GraphArtifactCheck[] = [];
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

export async function loadCommittedGraph(root: string): Promise<GraphArtifacts> {
  const read = async (relative: string): Promise<Record<string, unknown>> => {
    let value: unknown;
    try {
      value = JSON.parse(await readFile(path.join(root, relative), "utf8")) as unknown;
    } catch (error) {
      throw new Error(
        `GRAPH_ARTIFACT_READ ${relative}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (!isPlainObject(value))
      throw new Error(`GRAPH_ARTIFACT_SHAPE ${relative}: expected object.`);
    if (value.graph_contract_version !== GRAPH_CONTRACT_VERSION) {
      throw new Error(
        `GRAPH_SCHEMA_VERSION ${relative}: expected ${GRAPH_CONTRACT_VERSION}, found ${String(value.graph_contract_version)}.`,
      );
    }
    return value;
  };
  const [graph, conceptIndex, claimIndex, sourceIndex, relationshipIndex, manifest, policy] =
    await Promise.all([
      read("generated/graph/graph.json"),
      read("generated/indexes/concepts.json"),
      read("generated/indexes/claims.json"),
      read("generated/indexes/sources.json"),
      read("generated/indexes/relationships.json"),
      read("generated/graph/manifest.json"),
      read("generated/graph/traversal-policy.json"),
    ]);
  return {
    files: new Map(),
    nodes: asArray(graph.nodes) as GraphNode[],
    edges: asArray(graph.edges) as GraphEdge[],
    concepts: asArray(conceptIndex.records) as GraphIndexRecord[],
    claims: asArray(claimIndex.records) as GraphIndexRecord[],
    sources: asArray(sourceIndex.records) as GraphIndexRecord[],
    relationships: asArray(relationshipIndex.records) as GraphIndexRecord[],
    manifest,
    traversalPolicy: policy,
  };
}

export function validateGraphArtifacts(
  model: RepositoryModel,
  artifacts: GraphArtifacts,
): GraphValidationDiagnostic[] {
  const diagnostics: GraphValidationDiagnostic[] = [];
  const add = (code: string, artifactPath: string, message: string): void => {
    diagnostics.push({ code, path: artifactPath, message });
  };
  const nodeIds = new Set<string>();
  for (const node of artifacts.nodes) {
    if (nodeIds.has(node.id)) add("GRAPH_DUPLICATE_NODE", "generated/graph/nodes.json", node.id);
    nodeIds.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of artifacts.edges) {
    if (edgeIds.has(edge.id)) add("GRAPH_DUPLICATE_EDGE", "generated/graph/edges.json", edge.id);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      add(
        "GRAPH_UNRESOLVED_ENDPOINT",
        "generated/graph/edges.json",
        `${edge.id}: ${edge.from} -> ${edge.to}`,
      );
    }
    if (edge.traversable && edge.family !== "relationship") {
      add("GRAPH_PROVENANCE_TRAVERSABLE", "generated/graph/edges.json", edge.id);
    }
    if (!edge.traversable && !edge.traversal_exclusion_reason) {
      add("GRAPH_EXCLUSION_REASON_MISSING", "generated/graph/edges.json", edge.id);
    }
  }

  const familyExpectations: Array<[string, GraphIndexRecord[], number]> = [
    ["concept", artifacts.concepts, model.concepts.length],
    ["claim", artifacts.claims, model.claims.length],
    ["source", artifacts.sources, model.sources.length],
    ["relationship", artifacts.relationships, model.relationships.length],
  ];
  for (const [family, records, expected] of familyExpectations) {
    const ids = records.map((record) => record.id);
    if (new Set(ids).size !== ids.length) {
      add("GRAPH_DUPLICATE_INDEX_ID", `generated/indexes/${family}s.json`, family);
    }
    if (records.length !== expected) {
      add(
        "GRAPH_INDEX_COUNT",
        `generated/indexes/${family}s.json`,
        `expected ${expected}, found ${records.length}`,
      );
    }
    if (!isSorted(ids)) {
      add("GRAPH_NONDETERMINISTIC_ORDER", `generated/indexes/${family}s.json`, family);
    }
  }

  const claimNodeIds = new Set(artifacts.claims.map((claim) => claim.id));
  const sourceNodeIds = new Set(artifacts.sources.map((source) => source.id));
  const conceptNodeIds = new Set(artifacts.concepts.map((concept) => concept.id));
  const edgeById = new Map(artifacts.edges.map((edge) => [edge.id, edge]));
  const relationshipById = new Map(model.relationships.map((record) => [record.id, record]));
  const claimById = new Map(model.claims.map((record) => [record.id, record]));
  const sourceById = new Map(model.sources.map((record) => [record.id, record]));

  for (const claim of model.claims) {
    if (!claimNodeIds.has(claim.id)) add("GRAPH_CLAIM_MISSING", claim.path, claim.id);
    for (const sourceId of asStringArray(claim.data.sources)) {
      if (!sourceNodeIds.has(sourceId)) add("GRAPH_SOURCE_REFERENCE", claim.path, sourceId);
      const edge = edgeById.get(`edge:claim-source:${claim.id}:${sourceId}`);
      if (!edge) {
        add("GRAPH_CLAIM_EVIDENCE_MISSING", claim.path, `${claim.id} -> ${sourceId}`);
      } else {
        const expectedLocations = asArray(claim.data.source_locations).filter(
          (item) => isPlainObject(item) && item.source_id === sourceId,
        );
        if (serializeGraphValue(edge.source_locations) !== serializeGraphValue(expectedLocations)) {
          add("GRAPH_SOURCE_LOCATOR_LOST", claim.path, `${claim.id} -> ${sourceId}`);
        }
      }
    }
    for (const parentId of asStringArray(claim.data.derived_from_claims)) {
      if (!claimNodeIds.has(parentId)) add("GRAPH_CLAIM_REFERENCE", claim.path, parentId);
      if (!edgeById.has(`edge:claim-derived:${claim.id}:${parentId}`)) {
        add("GRAPH_DERIVATION_MISSING", claim.path, `${claim.id} -> ${parentId}`);
      }
    }
    for (const conceptId of asStringArray(claim.data.applicable_concept_ids)) {
      if (!conceptNodeIds.has(conceptId)) add("GRAPH_CONCEPT_REFERENCE", claim.path, conceptId);
    }
  }

  for (const relationship of model.relationships) {
    const edge = edgeById.get(`edge:relationship:${relationship.id}`);
    if (!edge) {
      add("GRAPH_RELATIONSHIP_EDGE_MISSING", relationship.path, relationship.id);
      continue;
    }
    const expectedDecision = relationshipTraversalDecision(relationship, claimById, sourceById);
    if (edge.traversable !== expectedDecision.eligible) {
      add("GRAPH_TRAVERSAL_POLICY", relationship.path, relationship.id);
    }
    if (edge.traversal_exclusion_reason !== expectedDecision.reason) {
      add("GRAPH_TRAVERSAL_EXPLANATION", relationship.path, relationship.id);
    }
    if (
      serializeGraphValue(edge.conditions) !==
      serializeGraphValue(asArray(relationship.data.conditions))
    ) {
      add("GRAPH_EDGE_CONDITION_LOST", relationship.path, relationship.id);
    }
    if (edge.semantic_scope !== (asString(relationship.data.semantic_scope) ?? null)) {
      add("GRAPH_SEMANTIC_SCOPE_LOST", relationship.path, relationship.id);
    }
    for (const claimId of asStringArray(relationship.data.evidence)) {
      if (!claimNodeIds.has(claimId))
        add("GRAPH_RELATIONSHIP_CLAIM_REFERENCE", relationship.path, claimId);
      if (!edgeById.has(`edge:relationship-claim:${relationship.id}:${claimId}`)) {
        add("GRAPH_RELATIONSHIP_EVIDENCE_MISSING", relationship.path, claimId);
      }
    }
  }

  validateAdjacencyArtifact(artifacts, false, add);
  validateAdjacencyArtifact(artifacts, true, add);
  const expectedNodes =
    model.concepts.length + model.claims.length + model.sources.length + model.relationships.length;
  if (artifacts.nodes.length !== expectedNodes) {
    add("GRAPH_NODE_COUNT", "generated/graph/manifest.json", String(artifacts.nodes.length));
  }
  if (artifacts.manifest.total_nodes !== artifacts.nodes.length) {
    add("GRAPH_MANIFEST_NODE_COUNT", "generated/graph/manifest.json", "count disagreement");
  }
  if (artifacts.manifest.total_edges !== artifacts.edges.length) {
    add("GRAPH_MANIFEST_EDGE_COUNT", "generated/graph/manifest.json", "count disagreement");
  }
  if (artifacts.manifest.unresolved_reference_count !== 0) {
    add("GRAPH_MANIFEST_UNRESOLVED", "generated/graph/manifest.json", "must be zero");
  }
  for (const [relative, contents] of artifacts.files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(contents) as unknown;
    } catch {
      add("GRAPH_ARTIFACT_JSON", relative, "invalid JSON");
      continue;
    }
    if (!isPlainObject(parsed) || parsed.graph_contract_version !== GRAPH_CONTRACT_VERSION) {
      add("GRAPH_SCHEMA_VERSION", relative, `expected ${GRAPH_CONTRACT_VERSION}`);
    }
    if (contents.includes("\\\\") || /[A-Za-z]:\\\\/.test(contents)) {
      add("GRAPH_PLATFORM_PATH", relative, "platform-dependent path separator");
    }
  }
  const missingRelationship = artifacts.relationships.find(
    (record) => !relationshipById.has(record.id),
  );
  if (missingRelationship) {
    add(
      "GRAPH_INDEX_UNKNOWN_RELATIONSHIP",
      missingRelationship.source_path,
      missingRelationship.id,
    );
  }

  return diagnostics.sort(
    (left, right) =>
      left.code.localeCompare(right.code) ||
      left.path.localeCompare(right.path) ||
      left.message.localeCompare(right.message),
  );
}

function validateAdjacencyArtifact(
  artifacts: GraphArtifacts,
  reverse: boolean,
  add: (code: string, path: string, message: string) => void,
): void {
  const relative = reverse
    ? "generated/graph/reverse-adjacency.json"
    : "generated/graph/adjacency.json";
  const contents = artifacts.files.get(relative);
  if (!contents) {
    add("GRAPH_ADJACENCY_MISSING", relative, "artifact missing");
    return;
  }
  const parsed = JSON.parse(contents) as unknown;
  const records = isPlainObject(parsed) ? asArray(parsed.records) : [];
  const expected = new Map(artifacts.nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of artifacts.edges) {
    expected.get(reverse ? edge.to : edge.from)?.add(edge.id);
    if (edge.direction === "symmetric") {
      expected.get(reverse ? edge.from : edge.to)?.add(edge.id);
    }
  }
  const normalized = [...expected.entries()]
    .map(([nodeId, ids]) => ({ node_id: nodeId, edge_ids: [...ids].sort() }))
    .sort((left, right) => left.node_id.localeCompare(right.node_id));
  if (serializeGraphValue(records) !== serializeGraphValue(normalized)) {
    add(reverse ? "GRAPH_REVERSE_ADJACENCY" : "GRAPH_ADJACENCY", relative, "edge disagreement");
  }
}

function isSorted(values: readonly string[]): boolean {
  return values.every(
    (value, index) => index === 0 || (values[index - 1] ?? "").localeCompare(value) <= 0,
  );
}
