import { createHash } from "node:crypto";

import { asArray, asString, asStringArray, isPlainObject, toPosix } from "./io.js";
import type { RecordEntry, RepositoryModel } from "./model.js";
import {
  DEFAULT_MAX_DEPTH,
  GRAPH_CONTRACT_VERSION,
  GRAPH_GENERATOR_VERSION,
  HARD_MAX_DEPTH,
  type GraphArtifacts,
  type GraphEdge,
  type GraphIndexRecord,
  type GraphNode,
  type GraphNodeFamily,
} from "./graph-types.js";

const artifactPaths = [
  "generated/graph/graph.json",
  "generated/graph/nodes.json",
  "generated/graph/edges.json",
  "generated/graph/adjacency.json",
  "generated/graph/reverse-adjacency.json",
  "generated/graph/traversal-policy.json",
  "generated/graph/orphan-analysis.json",
  "generated/graph/manifest.json",
  "generated/indexes/concepts.json",
  "generated/indexes/claims.json",
  "generated/indexes/relationships.json",
  "generated/indexes/sources.json",
] as const;

export function buildGraphArtifacts(model: RepositoryModel): GraphArtifacts {
  const humanKeys = humanKeyMap(model);
  const concepts = model.concepts.map((record) => indexRecord(record, humanKeys));
  const claims = model.claims.map((record) => indexRecord(record, humanKeys));
  const sources = model.sources.map((record) => indexRecord(record, humanKeys));
  const claimById = new Map(model.claims.map((record) => [record.id, record]));
  const sourceById = new Map(model.sources.map((record) => [record.id, record]));
  const relationships = model.relationships.map((record) => {
    const traversal = relationshipTraversalDecision(record, claimById, sourceById);
    const evidence = collectRelationshipEvidence(record, claimById);
    return indexRecord(record, humanKeys, {
      direct_source_ids: evidence.sourceIds,
      evidence_chain_claim_ids: evidence.claimIds,
      evidence_source_locations: evidence.sourceLocations,
      traversal_eligible: traversal.eligible,
      traversal_exclusion_reason: traversal.reason,
    });
  });

  sortById(concepts);
  sortById(claims);
  sortById(sources);
  sortById(relationships);

  const nodes = [
    ...model.concepts.map((record) => graphNode(record, "concept")),
    ...model.claims.map((record) => graphNode(record, "claim")),
    ...model.sources.map((record) => graphNode(record, "source")),
    ...model.relationships.map((record) => graphNode(record, "relationship")),
  ].sort(compareNodes);
  const edges = buildEdges(model, claimById, sourceById);
  const adjacency = buildAdjacency(nodes, edges, false);
  const reverseAdjacency = buildAdjacency(nodes, edges, true);
  const orphanAnalysis = buildOrphanAnalysis(model, relationships);
  const traversalDecisions = relationships.map((record) => ({
    relationship_id: record.id,
    eligible: record.traversal_eligible,
    exclusion_reason: record.traversal_exclusion_reason,
  }));
  const traversalPolicy = {
    graph_contract_version: GRAPH_CONTRACT_VERSION,
    artifact_type: "traversal-policy",
    policy: {
      mode: "default-deny",
      default_max_depth: DEFAULT_MAX_DEPTH,
      hard_max_depth: HARD_MAX_DEPTH,
      unevaluated_edge_local_conditions: "preserve-as-qualifier",
      incoming_semantics: "inspect-reverse-adjacency-without-inverse-predicate",
      requirements: [
        "repository-traversal-eligible",
        "sourced-relationship",
        "concept-global-scope",
        "resolved-concept-endpoints",
        "sourced-evidence-chain",
        "admitted-source-grounding",
        "quality-impact-evidence-policy",
      ],
    },
    decisions: traversalDecisions,
  };
  const edgeCounts = countBy(edges, (edge) => edge.family);
  const nodeCounts = countBy(nodes, (node) => node.family);
  const semanticRelationshipEdges = edges.filter((edge) => edge.family === "relationship");
  const relationshipAdjacencyEntries = semanticRelationshipEdges.reduce(
    (count, edge) => count + (edge.direction === "symmetric" ? 2 : 1),
    0,
  );
  const traversableCount = relationships.filter(
    (relationship) => relationship.traversal_eligible === true,
  ).length;
  const inputFingerprint = graphInputFingerprint(model);
  const manifest = {
    graph_contract_version: GRAPH_CONTRACT_VERSION,
    generator_contract_version: GRAPH_GENERATOR_VERSION,
    artifact_type: "graph-manifest",
    input_fingerprint: inputFingerprint,
    input_record_counts: {
      concepts: model.concepts.length,
      claims: model.claims.length,
      sources: model.sources.length,
      relationships: model.relationships.length,
    },
    output_node_counts: nodeCounts,
    output_edge_counts: edgeCounts,
    first_class_relationship_records: model.relationships.length,
    semantic_relationship_edges: semanticRelationshipEdges.length,
    forward_relationship_adjacency_entries: relationshipAdjacencyEntries,
    reverse_relationship_adjacency_entries: relationshipAdjacencyEntries,
    provenance_edges: edges.length - semanticRelationshipEdges.length,
    total_nodes: nodes.length,
    total_edges: edges.length,
    traversal_eligible_relationships: traversableCount,
    excluded_relationships: relationships.length - traversableCount,
    orphan_count: orphanAnalysis.summary.total_isolated_records,
    invalid_orphan_count: orphanAnalysis.summary.invalid_orphans,
    unresolved_reference_count: 0,
    generated_artifact_paths: [...artifactPaths],
  };

  const files = new Map<string, string>();
  addArtifact(files, "generated/graph/graph.json", {
    graph_contract_version: GRAPH_CONTRACT_VERSION,
    artifact_type: "graph",
    nodes,
    edges,
  });
  addArtifact(files, "generated/graph/nodes.json", {
    graph_contract_version: GRAPH_CONTRACT_VERSION,
    artifact_type: "nodes",
    records: nodes,
  });
  addArtifact(files, "generated/graph/edges.json", {
    graph_contract_version: GRAPH_CONTRACT_VERSION,
    artifact_type: "edges",
    records: edges,
  });
  addArtifact(files, "generated/graph/adjacency.json", {
    graph_contract_version: GRAPH_CONTRACT_VERSION,
    artifact_type: "forward-adjacency",
    records: adjacency,
  });
  addArtifact(files, "generated/graph/reverse-adjacency.json", {
    graph_contract_version: GRAPH_CONTRACT_VERSION,
    artifact_type: "reverse-adjacency",
    records: reverseAdjacency,
  });
  addArtifact(files, "generated/graph/traversal-policy.json", traversalPolicy);
  addArtifact(files, "generated/graph/orphan-analysis.json", orphanAnalysis);
  addArtifact(files, "generated/graph/manifest.json", manifest);
  addIndex(files, "concepts", concepts);
  addIndex(files, "claims", claims);
  addIndex(files, "relationships", relationships);
  addIndex(files, "sources", sources);

  return {
    files,
    nodes,
    edges,
    concepts,
    claims,
    sources,
    relationships,
    manifest,
    traversalPolicy,
  };
}

export function serializeGraphValue(value: unknown): string {
  return `${JSON.stringify(sortObjectKeys(value), null, 2)}\n`;
}

export function graphInputFingerprint(model: RepositoryModel): string {
  const inputs = {
    records: model.records
      .map((record) => ({ path: toPosix(record.path), data: record.data }))
      .sort((left, right) => left.path.localeCompare(right.path)),
    relationship_types: model.ontology.relationshipTypes,
    relationship_defaults: model.ontology.relationshipDefaults,
    validation_policies: model.ontology.validationPolicies,
    id_allocations: asArray(model.idLedger.allocations),
  };
  return `sha256:${createHash("sha256").update(serializeGraphValue(inputs)).digest("hex")}`;
}

export function relationshipTraversalDecision(
  relationship: RecordEntry,
  claimById: ReadonlyMap<string, RecordEntry>,
  sourceById: ReadonlyMap<string, RecordEntry>,
): { eligible: boolean; reason: string | null } {
  const traversal = isPlainObject(relationship.data.traversal) ? relationship.data.traversal : {};
  if (traversal.eligible !== true) {
    return {
      eligible: false,
      reason: asString(traversal.rationale) ?? "policy:repository-traversal-not-enabled",
    };
  }
  if (relationship.data.status !== "sourced") {
    return { eligible: false, reason: "policy:relationship-not-sourced" };
  }
  if (relationship.data.semantic_scope !== "concept-global") {
    return { eligible: false, reason: "policy:relationship-not-concept-global" };
  }
  const evidenceIds = asStringArray(relationship.data.evidence);
  if (evidenceIds.length === 0) {
    return { eligible: false, reason: "policy:relationship-evidence-missing" };
  }
  const evidenceClaims = evidenceIds.map((id) => claimById.get(id));
  if (evidenceClaims.some((claim) => claim === undefined)) {
    return { eligible: false, reason: "policy:relationship-evidence-unresolved" };
  }
  if (evidenceClaims.some((claim) => claim?.data.status !== "sourced")) {
    return { eligible: false, reason: "policy:relationship-evidence-not-sourced" };
  }
  if (
    new Set(["improves", "degrades"]).has(asString(relationship.data.predicate) ?? "") &&
    evidenceClaims.some((claim) =>
      new Set(["inference", "recommendation", "hypothesis", "opinion"]).has(
        asString(claim?.data.claim_type) ?? "",
      ),
    )
  ) {
    return { eligible: false, reason: "policy:quality-impact-evidence-ineligible" };
  }
  for (const claim of evidenceClaims) {
    if (!claim || !claimHasAdmittedGrounding(claim, claimById, sourceById, new Set())) {
      return { eligible: false, reason: "policy:evidence-chain-not-admitted" };
    }
  }
  return { eligible: true, reason: null };
}

function claimHasAdmittedGrounding(
  claim: RecordEntry,
  claimById: ReadonlyMap<string, RecordEntry>,
  sourceById: ReadonlyMap<string, RecordEntry>,
  visited: Set<string>,
): boolean {
  if (visited.has(claim.id)) return false;
  const nextVisited = new Set(visited).add(claim.id);
  const directSources = asStringArray(claim.data.sources);
  const directGrounded = directSources.every((id) => {
    const status = sourceById.get(id)?.data.status;
    return status === "approved" || status === "restricted";
  });
  if (!directGrounded) return false;
  const derivedIds = asStringArray(claim.data.derived_from_claims);
  if (directSources.length === 0 && derivedIds.length === 0) return false;
  return derivedIds.every((id) => {
    const parent = claimById.get(id);
    return parent ? claimHasAdmittedGrounding(parent, claimById, sourceById, nextVisited) : false;
  });
}

function buildEdges(
  model: RepositoryModel,
  claimById: ReadonlyMap<string, RecordEntry>,
  sourceById: ReadonlyMap<string, RecordEntry>,
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const relationship of model.relationships) {
    const traversal = relationshipTraversalDecision(relationship, claimById, sourceById);
    const evidence = collectRelationshipEvidence(relationship, claimById);
    edges.push({
      id: `edge:relationship:${relationship.id}`,
      family: "relationship",
      from: asString(relationship.data.subject) ?? "",
      to: asString(relationship.data.object) ?? "",
      predicate: asString(relationship.data.predicate) ?? "",
      relationship_id: relationship.id,
      direction: relationship.data.direction === "symmetric" ? "symmetric" : "directed",
      status: asString(relationship.data.status) ?? null,
      confidence: asString(relationship.data.confidence) ?? null,
      semantic_scope: asString(relationship.data.semantic_scope) ?? null,
      conditions: asArray(relationship.data.conditions),
      exceptions: [],
      claim_ids: asStringArray(relationship.data.evidence).sort(),
      source_ids: evidence.sourceIds,
      source_locations: evidence.sourceLocations,
      traversable: traversal.eligible,
      traversal_exclusion_reason: traversal.reason,
      source_path: toPosix(relationship.path),
    });
    for (const claimId of asStringArray(relationship.data.evidence).sort()) {
      edges.push(
        provenanceEdge(
          `edge:relationship-claim:${relationship.id}:${claimId}`,
          "relationship-supported-by-claim",
          relationship.id,
          claimId,
          "supported-by-claim",
          relationship.path,
        ),
      );
    }
  }
  for (const concept of model.concepts) {
    for (const claimId of asStringArray(concept.data.claims).sort()) {
      edges.push(
        provenanceEdge(
          `edge:concept-claim:${concept.id}:${claimId}`,
          "concept-declares-claim",
          concept.id,
          claimId,
          "declares-claim",
          concept.path,
        ),
      );
    }
  }
  for (const claim of model.claims) {
    for (const sourceId of asStringArray(claim.data.sources).sort()) {
      const sourceLocations = asArray(claim.data.source_locations).filter(
        (item) => isPlainObject(item) && item.source_id === sourceId,
      );
      edges.push({
        ...provenanceEdge(
          `edge:claim-source:${claim.id}:${sourceId}`,
          "claim-supported-by-source",
          claim.id,
          sourceId,
          "supported-by",
          claim.path,
        ),
        source_ids: [sourceId],
        source_locations: sourceLocations,
      });
    }
    for (const parentId of asStringArray(claim.data.derived_from_claims).sort()) {
      edges.push(
        provenanceEdge(
          `edge:claim-derived:${claim.id}:${parentId}`,
          "claim-derived-from-claim",
          claim.id,
          parentId,
          "derived-from",
          claim.path,
        ),
      );
    }
    for (const conceptId of asStringArray(claim.data.applicable_concept_ids).sort()) {
      edges.push(
        provenanceEdge(
          `edge:claim-applicable:${claim.id}:${conceptId}`,
          "claim-applicable-to-concept",
          claim.id,
          conceptId,
          "applicable-to",
          claim.path,
        ),
      );
    }
  }
  return edges.sort(compareEdges);
}

function provenanceEdge(
  id: string,
  family: GraphEdge["family"],
  from: string,
  to: string,
  predicate: string,
  sourcePath: string,
): GraphEdge {
  return {
    id,
    family,
    from,
    to,
    predicate,
    relationship_id: null,
    direction: "directed",
    status: null,
    confidence: null,
    semantic_scope: null,
    conditions: [],
    exceptions: [],
    claim_ids: family.includes("claim") ? [from, to].filter((id) => id.startsWith("AKL-")) : [],
    source_ids: [],
    source_locations: [],
    traversable: false,
    traversal_exclusion_reason: "policy:provenance-edge-not-concept-traversal",
    source_path: toPosix(sourcePath),
  };
}

function collectRelationshipEvidence(
  relationship: RecordEntry,
  claimById: ReadonlyMap<string, RecordEntry>,
): { claimIds: string[]; sourceIds: string[]; sourceLocations: unknown[] } {
  const claimIds = new Set<string>();
  const sourceIds = new Set<string>();
  const locations = new Map<string, unknown>();
  const visit = (claimId: string): void => {
    if (claimIds.has(claimId)) return;
    claimIds.add(claimId);
    const claim = claimById.get(claimId);
    if (!claim) return;
    for (const sourceId of asStringArray(claim.data.sources)) sourceIds.add(sourceId);
    for (const location of asArray(claim.data.source_locations)) {
      locations.set(serializeGraphValue(location), location);
    }
    for (const parentId of asStringArray(claim.data.derived_from_claims)) visit(parentId);
  };
  for (const claimId of asStringArray(relationship.data.evidence)) visit(claimId);
  return {
    claimIds: [...claimIds].sort(),
    sourceIds: [...sourceIds].sort(),
    sourceLocations: [...locations.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => value),
  };
}

function buildAdjacency(nodes: GraphNode[], edges: GraphEdge[], reverse: boolean): unknown[] {
  const adjacency = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of edges) {
    const primary = reverse ? edge.to : edge.from;
    adjacency.get(primary)?.add(edge.id);
    if (edge.direction === "symmetric") {
      const secondary = reverse ? edge.from : edge.to;
      adjacency.get(secondary)?.add(edge.id);
    }
  }
  return [...adjacency.entries()]
    .map(([nodeId, edgeIds]) => ({ node_id: nodeId, edge_ids: [...edgeIds].sort() }))
    .sort((left, right) => left.node_id.localeCompare(right.node_id));
}

function buildOrphanAnalysis(
  model: RepositoryModel,
  relationships: GraphIndexRecord[],
): {
  graph_contract_version: number;
  artifact_type: string;
  summary: {
    total_isolated_records: number;
    invalid_orphans: number;
    intentional_or_explained_isolation: number;
  };
  invalid: Record<string, unknown>;
  intentional_or_explained: Record<string, unknown>;
} {
  const relationshipByConcept = new Map<string, GraphIndexRecord[]>();
  for (const relationship of relationships) {
    for (const endpoint of [relationship.subject, relationship.object]) {
      if (typeof endpoint !== "string") continue;
      const entries = relationshipByConcept.get(endpoint) ?? [];
      entries.push(relationship);
      relationshipByConcept.set(endpoint, entries);
    }
  }
  const noRelationships = model.concepts
    .filter((concept) => !relationshipByConcept.has(concept.id))
    .map((concept) => concept.id)
    .sort();
  const claimsButNoRelationships = model.concepts
    .filter(
      (concept) =>
        asStringArray(concept.data.claims).length > 0 && !relationshipByConcept.has(concept.id),
    )
    .map((concept) => concept.id)
    .sort();
  const onlyExcluded = model.concepts
    .filter((concept) => {
      const connected = relationshipByConcept.get(concept.id) ?? [];
      return connected.length > 0 && connected.every((item) => item.traversal_eligible !== true);
    })
    .map((concept) => concept.id)
    .sort();
  const usedSources = new Set(model.claims.flatMap((claim) => asStringArray(claim.data.sources)));
  const unusedSources = model.sources
    .filter((source) => !usedSources.has(source.id))
    .map((source) => source.id)
    .sort();
  const declaredClaims = new Set(
    model.concepts.flatMap((concept) => asStringArray(concept.data.claims)),
  );
  const unprojectedClaims: string[] = [];
  for (const claim of model.claims) {
    if (!declaredClaims.has(claim.id)) unprojectedClaims.push(claim.id);
  }
  const excludedRelationships = relationships
    .filter((relationship) => relationship.traversal_eligible !== true)
    .map((relationship) => ({
      relationship_id: relationship.id,
      reason: relationship.traversal_exclusion_reason,
    }));
  return {
    graph_contract_version: GRAPH_CONTRACT_VERSION,
    artifact_type: "orphan-analysis",
    summary: {
      total_isolated_records: new Set([...noRelationships, ...unusedSources, ...unprojectedClaims])
        .size,
      invalid_orphans: unprojectedClaims.length,
      intentional_or_explained_isolation: new Set([
        ...noRelationships,
        ...unusedSources,
        ...onlyExcluded,
      ]).size,
    },
    invalid: {
      claims_not_projected_by_required_concepts: unprojectedClaims.sort(),
    },
    intentional_or_explained: {
      concepts_with_no_first_class_relationships: noRelationships,
      concepts_with_claims_but_no_relationships: claimsButNoRelationships,
      concepts_referenced_only_through_non_traversable_edges: onlyExcluded,
      sources_with_no_supporting_claims: unusedSources,
      relationships_excluded_from_traversal_by_design: excludedRelationships,
    },
  };
}

function indexRecord(
  record: RecordEntry,
  humanKeys: ReadonlyMap<string, { current: string | null; previous: string[] }>,
  additions: Record<string, unknown> = {},
): GraphIndexRecord {
  const keys = humanKeys.get(record.id);
  return {
    ...(sortObjectKeys(record.data) as Record<string, unknown>),
    ...(record.recordKind === "concept"
      ? {
          human_key: keys?.current ?? null,
          previous_human_keys: keys?.previous ?? [],
        }
      : {}),
    ...additions,
    id: record.id,
    record_kind: record.recordKind as GraphNodeFamily,
    source_path: toPosix(record.path),
  };
}

function graphNode(record: RecordEntry, family: GraphNodeFamily): GraphNode {
  const title =
    asString(record.data.title) ??
    asString(record.data.statement) ??
    asString(record.data.predicate) ??
    null;
  return {
    id: record.id,
    family,
    source_path: toPosix(record.path),
    status: asString(record.data.status) ?? null,
    title,
  };
}

function humanKeyMap(
  model: RepositoryModel,
): Map<string, { current: string | null; previous: string[] }> {
  const result = new Map<string, { current: string | null; previous: string[] }>();
  for (const allocation of asArray(model.idLedger.allocations).filter(isPlainObject)) {
    const id = asString(allocation.id);
    if (!id) continue;
    result.set(id, {
      current: asString(allocation.human_key) ?? null,
      previous: asStringArray(allocation.previous_human_keys).sort(),
    });
  }
  return result;
}

function addIndex(
  files: Map<string, string>,
  family: "concepts" | "claims" | "relationships" | "sources",
  records: GraphIndexRecord[],
): void {
  addArtifact(files, `generated/indexes/${family}.json`, {
    graph_contract_version: GRAPH_CONTRACT_VERSION,
    artifact_type: `${family}-index`,
    exact_match_normalization: "case-sensitive-unicode-code-point",
    records,
  });
}

function addArtifact(files: Map<string, string>, artifactPath: string, value: unknown): void {
  files.set(artifactPath, serializeGraphValue(value));
}

function sortById(records: GraphIndexRecord[]): void {
  records.sort((left, right) => left.id.localeCompare(right.id));
}

function compareNodes(left: GraphNode, right: GraphNode): number {
  return left.family.localeCompare(right.family) || left.id.localeCompare(right.id);
}

function compareEdges(left: GraphEdge, right: GraphEdge): number {
  return (
    left.family.localeCompare(right.family) ||
    left.from.localeCompare(right.from) ||
    left.predicate.localeCompare(right.predicate) ||
    left.to.localeCompare(right.to) ||
    left.id.localeCompare(right.id)
  );
}

function countBy<T>(values: readonly T[], key: (value: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const item = key(value);
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortObjectKeys(value[key])]),
  );
}
