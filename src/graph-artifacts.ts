import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { asArray, asString, asStringArray, isPlainObject, toPosix } from "./io.js";
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

export async function loadCurrentGraph(
  root: string,
  expectedArtifacts: GraphArtifacts,
): Promise<GraphArtifacts> {
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
  const [
    graph,
    conceptIndex,
    claimIndex,
    sourceIndex,
    relationshipIndex,
    decisionGuideIndex,
    manifest,
    policy,
  ] = await Promise.all([
    read("generated/graph/graph.json"),
    read("generated/indexes/concepts.json"),
    read("generated/indexes/claims.json"),
    read("generated/indexes/sources.json"),
    read("generated/indexes/relationships.json"),
    read("generated/indexes/decision-guides.json"),
    read("generated/graph/manifest.json"),
    read("generated/graph/traversal-policy.json"),
  ]);
  const loaded = {
    files: new Map(),
    nodes: asArray(graph.nodes) as GraphNode[],
    edges: asArray(graph.edges) as GraphEdge[],
    concepts: asArray(conceptIndex.records) as GraphIndexRecord[],
    claims: asArray(claimIndex.records) as GraphIndexRecord[],
    sources: asArray(sourceIndex.records) as GraphIndexRecord[],
    relationships: asArray(relationshipIndex.records) as GraphIndexRecord[],
    decisionGuides: asArray(decisionGuideIndex.records) as GraphIndexRecord[],
    manifest,
    traversalPolicy: policy,
  };
  const checks = await checkGraphArtifacts(root, expectedArtifacts);
  const changed = checks.filter((item) => item.status !== "current");
  if (changed.length > 0) {
    throw new Error(
      "GRAPH_ARTIFACT_NOT_CURRENT " +
        changed.map((item) => item.status + ":" + item.path).join(", "),
    );
  }
  return loaded;
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
  const nodeById = new Map<string, GraphNode>();
  for (const node of artifacts.nodes) {
    if (nodeIds.has(node.id)) add("GRAPH_DUPLICATE_NODE", "generated/graph/nodes.json", node.id);
    nodeIds.add(node.id);
    nodeById.set(node.id, node);
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
    ["decision-guide", artifacts.decisionGuides, model.decisionGuides.length],
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

  const recordsByFamily: Array<[string, GraphIndexRecord[], typeof model.records]> = [
    ["concept", artifacts.concepts, model.concepts],
    ["claim", artifacts.claims, model.claims],
    ["source", artifacts.sources, model.sources],
    ["relationship", artifacts.relationships, model.relationships],
    ["decision-guide", artifacts.decisionGuides, model.decisionGuides],
  ];
  for (const [family, indexedRecords, authoritativeRecords] of recordsByFamily) {
    const indexedById = new Map(indexedRecords.map((record) => [record.id, record]));
    const authoritativeById = new Map(authoritativeRecords.map((record) => [record.id, record]));
    for (const record of authoritativeRecords) {
      const indexed = indexedById.get(record.id);
      if (!indexed) {
        add("GRAPH_INDEX_RECORD_MISSING", record.path, record.id);
        continue;
      }
      if (
        indexed.record_kind !== record.recordKind ||
        indexed.source_path !== toPosix(record.path)
      ) {
        add("GRAPH_INDEX_FIDELITY", record.path, record.id + ": identity metadata differs");
      }
      for (const [key, value] of Object.entries(record.data)) {
        if (serializeGraphValue(indexed[key]) !== serializeGraphValue(value)) {
          add("GRAPH_INDEX_FIDELITY", record.path, record.id + ": " + key);
        }
      }
    }
    for (const indexed of indexedRecords) {
      if (!authoritativeById.has(indexed.id)) {
        add("GRAPH_INDEX_UNKNOWN_RECORD", "generated/indexes/" + family + "s.json", indexed.id);
      }
    }
  }

  for (const record of model.records) {
    const node = nodeById.get(record.id);
    if (!node) {
      add("GRAPH_NODE_MISSING", record.path, record.id);
      continue;
    }
    const expectedTitle =
      asString(record.data.title) ??
      asString(record.data.statement) ??
      asString(record.data.predicate) ??
      null;
    if (
      node.family !== record.recordKind ||
      node.source_path !== toPosix(record.path) ||
      node.status !== (asString(record.data.status) ?? null) ||
      node.title !== expectedTitle
    ) {
      add("GRAPH_NODE_FIDELITY", record.path, record.id);
    }
  }
  for (const node of artifacts.nodes) {
    if (!model.records.some((record) => record.id === node.id)) {
      add("GRAPH_NODE_UNKNOWN", "generated/graph/nodes.json", node.id);
    }
  }

  const expectedProvenance = expectedProvenanceEdges(model);
  for (const [id, expected] of expectedProvenance) {
    const edge = edgeById.get(id);
    if (!edge) {
      add("GRAPH_PROVENANCE_EDGE_MISSING", expected.sourcePath, id);
      continue;
    }
    if (
      edge.family !== expected.family ||
      edge.from !== expected.from ||
      edge.to !== expected.to ||
      edge.predicate !== expected.predicate ||
      edge.direction !== "directed" ||
      edge.traversable !== false ||
      edge.source_path !== toPosix(expected.sourcePath)
    ) {
      add("GRAPH_PROVENANCE_FIDELITY", expected.sourcePath, id);
    }
  }
  for (const edge of artifacts.edges) {
    if (edge.family !== "relationship" && !expectedProvenance.has(edge.id)) {
      add("GRAPH_PROVENANCE_EDGE_UNKNOWN", "generated/graph/edges.json", edge.id);
    }
  }

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
        if (
          edge.family !== "claim-supported-by-source" ||
          edge.from !== claim.id ||
          edge.to !== sourceId ||
          edge.predicate !== "supported-by" ||
          serializeGraphValue(edge.source_ids) !== serializeGraphValue([sourceId])
        ) {
          add("GRAPH_CLAIM_EVIDENCE_FIDELITY", claim.path, claim.id + " -> " + sourceId);
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
      if (!edgeById.has("edge:claim-applicable:" + claim.id + ":" + conceptId)) {
        add("GRAPH_APPLICABILITY_MISSING", claim.path, claim.id + " -> " + conceptId);
      }
    }
  }

  for (const relationship of model.relationships) {
    const edge = edgeById.get(`edge:relationship:${relationship.id}`);
    if (!edge) {
      add("GRAPH_RELATIONSHIP_EDGE_MISSING", relationship.path, relationship.id);
      continue;
    }
    const expectedDecision = relationshipTraversalDecision(relationship, claimById, sourceById);
    const expectedEvidence = collectExpectedClaimEvidence(
      asStringArray(relationship.data.evidence),
      claimById,
    );
    if (
      edge.from !== asString(relationship.data.subject) ||
      edge.to !== asString(relationship.data.object) ||
      edge.predicate !== asString(relationship.data.predicate) ||
      edge.direction !== (relationship.data.direction === "symmetric" ? "symmetric" : "directed") ||
      edge.status !== (asString(relationship.data.status) ?? null) ||
      edge.confidence !== (asString(relationship.data.confidence) ?? null) ||
      edge.strength !== (asString(relationship.data.strength) ?? null) ||
      edge.source_path !== toPosix(relationship.path) ||
      serializeGraphValue(edge.claim_ids) !==
        serializeGraphValue(asStringArray(relationship.data.evidence).sort()) ||
      serializeGraphValue(edge.source_ids) !== serializeGraphValue(expectedEvidence.sourceIds) ||
      serializeGraphValue(edge.source_locations) !==
        serializeGraphValue(expectedEvidence.sourceLocations)
    ) {
      add("GRAPH_RELATIONSHIP_FIDELITY", relationship.path, relationship.id);
    }
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
    model.concepts.length +
    model.claims.length +
    model.sources.length +
    model.relationships.length +
    model.decisionGuides.length;
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

interface ExpectedProvenanceEdge {
  family: GraphEdge["family"];
  from: string;
  to: string;
  predicate: string;
  sourcePath: string;
}

function expectedProvenanceEdges(model: RepositoryModel): Map<string, ExpectedProvenanceEdge> {
  const expected = new Map<string, ExpectedProvenanceEdge>();
  const add = (
    id: string,
    family: GraphEdge["family"],
    from: string,
    to: string,
    predicate: string,
    sourcePath: string,
  ): void => {
    expected.set(id, { family, from, to, predicate, sourcePath });
  };
  for (const concept of model.concepts) {
    for (const claimId of asStringArray(concept.data.claims)) {
      add(
        "edge:concept-claim:" + concept.id + ":" + claimId,
        "concept-declares-claim",
        concept.id,
        claimId,
        "declares-claim",
        concept.path,
      );
    }
  }
  for (const claim of model.claims) {
    for (const sourceId of asStringArray(claim.data.sources)) {
      add(
        "edge:claim-source:" + claim.id + ":" + sourceId,
        "claim-supported-by-source",
        claim.id,
        sourceId,
        "supported-by",
        claim.path,
      );
    }
    for (const parentId of asStringArray(claim.data.derived_from_claims)) {
      add(
        "edge:claim-derived:" + claim.id + ":" + parentId,
        "claim-derived-from-claim",
        claim.id,
        parentId,
        "derived-from",
        claim.path,
      );
    }
    for (const conceptId of asStringArray(claim.data.applicable_concept_ids)) {
      add(
        "edge:claim-applicable:" + claim.id + ":" + conceptId,
        "claim-applicable-to-concept",
        claim.id,
        conceptId,
        "applicable-to",
        claim.path,
      );
    }
  }
  for (const relationship of model.relationships) {
    for (const claimId of asStringArray(relationship.data.evidence)) {
      add(
        "edge:relationship-claim:" + relationship.id + ":" + claimId,
        "relationship-supported-by-claim",
        relationship.id,
        claimId,
        "supported-by-claim",
        relationship.path,
      );
    }
  }
  for (const guide of model.decisionGuides) {
    for (const claimId of asStringArray(guide.data.evidence)) {
      add(
        "edge:decision-guide-claim:" + guide.id + ":" + claimId,
        "decision-guide-supported-by-claim",
        guide.id,
        claimId,
        "supported-by-claim",
        guide.path,
      );
    }
    for (const option of asArray(guide.data.options).filter(isPlainObject)) {
      const conceptId = asString(option.concept_id);
      if (conceptId)
        add(
          "edge:decision-guide-option:" + guide.id + ":" + conceptId,
          "decision-guide-considers-option",
          guide.id,
          conceptId,
          "considers-option",
          guide.path,
        );
    }
    for (const constraint of asArray(guide.data.constraints).filter(isPlainObject)) {
      const conceptId = asString(constraint.concept_id);
      if (conceptId)
        add(
          "edge:decision-guide-constraint:" + guide.id + ":" + conceptId,
          "decision-guide-constrained-by-concept",
          guide.id,
          conceptId,
          "constrained-by",
          guide.path,
        );
    }
    for (const quality of asArray(guide.data.quality_attributes).filter(isPlainObject)) {
      const conceptId = asString(quality.concept_id);
      if (conceptId)
        add(
          "edge:decision-guide-quality:" + guide.id + ":" + conceptId,
          "decision-guide-evaluates-quality-attribute",
          guide.id,
          conceptId,
          "evaluates-quality-attribute",
          guide.path,
        );
    }
  }
  return expected;
}

function collectExpectedClaimEvidence(
  initialClaimIds: string[],
  claimById: ReadonlyMap<string, { id: string; data: Record<string, unknown> }>,
): { sourceIds: string[]; sourceLocations: unknown[] } {
  const visited = new Set<string>();
  const sourceIds = new Set<string>();
  const locations = new Map<string, unknown>();
  const visit = (claimId: string): void => {
    if (visited.has(claimId)) return;
    visited.add(claimId);
    const claim = claimById.get(claimId);
    if (!claim) return;
    for (const sourceId of asStringArray(claim.data.sources)) sourceIds.add(sourceId);
    for (const location of asArray(claim.data.source_locations)) {
      locations.set(serializeGraphValue(location), location);
    }
    for (const parentId of asStringArray(claim.data.derived_from_claims)) visit(parentId);
  };
  for (const claimId of initialClaimIds) visit(claimId);
  return {
    sourceIds: [...sourceIds].sort(),
    sourceLocations: [...locations.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, location]) => location),
  };
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
