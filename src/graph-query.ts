import { asArray, asString, asStringArray, isPlainObject } from "./io.js";
import {
  DEFAULT_MAX_DEPTH,
  GRAPH_CONTRACT_VERSION,
  HARD_MAX_DEPTH,
  type GraphArtifacts,
  type GraphEdge,
  type GraphEnvelope,
  type GraphIndexRecord,
  type GraphQueryDiagnostic,
} from "./graph-types.js";

export type GraphDirection = "outgoing" | "incoming" | "both";

export interface NeighborOptions {
  direction?: GraphDirection;
  predicates?: string[];
  includeExcluded?: boolean;
}

export interface TraverseOptions extends NeighborOptions {
  maxDepth?: number;
  conceptTypes?: string[];
  domains?: string[];
}

export class GraphQueryEngine {
  private readonly recordById: Map<string, GraphIndexRecord>;
  private readonly edgeById: Map<string, GraphEdge>;
  private readonly relationshipEdges: GraphEdge[];

  constructor(private readonly graph: GraphArtifacts) {
    this.recordById = new Map(
      [...graph.concepts, ...graph.claims, ...graph.sources, ...graph.relationships].map(
        (record) => [record.id, record],
      ),
    );
    this.edgeById = new Map(graph.edges.map((edge) => [edge.id, edge]));
    this.relationshipEdges = graph.edges
      .filter((edge) => edge.family === "relationship")
      .sort(compareEdges);
  }

  get(identifier: string): GraphEnvelope<unknown> {
    const resolution = this.resolveIdentifier(identifier);
    if (!resolution.record) return failure({ command: "get", identifier }, resolution.diagnostics);
    const id = resolution.record.id;
    return envelope({ command: "get", identifier }, [
      {
        family: resolution.record.record_kind,
        record: resolution.record,
        connected_references: {
          outgoing_edge_ids: this.graph.edges
            .filter(
              (edge) => edge.from === id || (edge.direction === "symmetric" && edge.to === id),
            )
            .map((edge) => edge.id)
            .sort(),
          incoming_edge_ids: this.graph.edges
            .filter(
              (edge) => edge.to === id || (edge.direction === "symmetric" && edge.from === id),
            )
            .map((edge) => edge.id)
            .sort(),
        },
      },
    ]);
  }

  neighbors(identifier: string, options: NeighborOptions = {}): GraphEnvelope<unknown> {
    const query = {
      command: "neighbors",
      identifier,
      direction: options.direction ?? "both",
      predicates: options.predicates ?? [],
      include_excluded: options.includeExcluded ?? false,
    };
    const resolution = this.resolveIdentifier(identifier);
    if (!resolution.record) return failure(query, resolution.diagnostics);
    if (resolution.record.record_kind !== "concept") {
      return failure(query, [diagnostic("GRAPH_QUERY_FAMILY", "Neighbors require a concept ID.")]);
    }
    return envelope(query, this.neighborResults(resolution.record.id, options));
  }

  traverse(identifier: string, options: TraverseOptions = {}): GraphEnvelope<unknown> {
    const maxDepth = checkedDepth(options.maxDepth);
    const query = {
      command: "traverse",
      identifier,
      max_depth: maxDepth,
      direction: options.direction ?? "outgoing",
      predicates: options.predicates ?? [],
      concept_types: options.conceptTypes ?? [],
      domains: options.domains ?? [],
    };
    const resolution = this.resolveIdentifier(identifier);
    if (!resolution.record) return failure(query, resolution.diagnostics);
    if (resolution.record.record_kind !== "concept") {
      return failure(query, [diagnostic("GRAPH_QUERY_FAMILY", "Traversal requires a concept ID.")]);
    }
    const paths = this.walk(resolution.record.id, maxDepth, options, undefined);
    return envelope(query, paths);
  }

  paths(
    fromIdentifier: string,
    toIdentifier: string,
    options: TraverseOptions = {},
  ): GraphEnvelope<unknown> {
    const maxDepth = checkedDepth(options.maxDepth);
    const query = {
      command: "path",
      from: fromIdentifier,
      to: toIdentifier,
      max_depth: maxDepth,
      direction: options.direction ?? "outgoing",
      predicates: options.predicates ?? [],
    };
    const from = this.resolveIdentifier(fromIdentifier);
    const to = this.resolveIdentifier(toIdentifier);
    const diagnostics = [...from.diagnostics, ...to.diagnostics];
    if (!from.record || !to.record) return failure(query, diagnostics);
    if (from.record.record_kind !== "concept" || to.record.record_kind !== "concept") {
      return failure(query, [diagnostic("GRAPH_QUERY_FAMILY", "Path endpoints must be concepts.")]);
    }
    const paths = this.walk(from.record.id, maxDepth, options, to.record.id);
    return envelope(query, paths);
  }

  claimsForConcept(
    identifier: string,
    filters: Record<string, string[]> = {},
  ): GraphEnvelope<unknown> {
    const query = { command: "claims", identifier, filters };
    const resolution = this.resolveIdentifier(identifier);
    if (!resolution.record) return failure(query, resolution.diagnostics);
    if (resolution.record.record_kind !== "concept") {
      return failure(query, [diagnostic("GRAPH_QUERY_FAMILY", "Claims query requires a concept.")]);
    }
    const declared = new Set(asStringArray(resolution.record.claims));
    const records = this.graph.claims.filter(
      (claim) =>
        claim.subject === resolution.record?.id ||
        declared.has(claim.id) ||
        asStringArray(claim.applicable_concept_ids).includes(resolution.record?.id ?? ""),
    );
    return envelope(query, filterRecords(records, "claims", filters));
  }

  evidenceForClaim(identifier: string): GraphEnvelope<unknown> {
    const query = { command: "evidence", identifier };
    const resolution = this.resolveIdentifier(identifier);
    if (!resolution.record) return failure(query, resolution.diagnostics);
    if (resolution.record.record_kind !== "claim") {
      return failure(query, [
        diagnostic("GRAPH_QUERY_FAMILY", "Evidence query requires a claim ID."),
      ]);
    }
    const claim = resolution.record;
    const derivedClaims = asStringArray(claim.derived_from_claims)
      .map((id) => this.recordById.get(id))
      .filter((record): record is GraphIndexRecord => record !== undefined);
    const directSources = asStringArray(claim.sources)
      .map((id) => this.recordById.get(id))
      .filter((record): record is GraphIndexRecord => record !== undefined);
    const derivedSourceIds = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string): void => {
      if (visited.has(id)) return;
      visited.add(id);
      const parent = this.recordById.get(id);
      if (!parent) return;
      for (const sourceId of asStringArray(parent.sources)) derivedSourceIds.add(sourceId);
      for (const parentId of asStringArray(parent.derived_from_claims)) visit(parentId);
    };
    for (const derived of derivedClaims) visit(derived.id);
    return envelope(query, [
      {
        claim_id: claim.id,
        claim_type: claim.claim_type,
        confidence: claim.confidence,
        status: claim.status,
        semantic_scope: claim.semantic_scope,
        normative: claim.normative ?? null,
        applicable_concept_ids: asStringArray(claim.applicable_concept_ids),
        direct_evidence: {
          source_ids: asStringArray(claim.sources),
          source_locations: asArray(claim.source_locations),
          sources: directSources,
        },
        derived_evidence: {
          claim_ids: derivedClaims.map((record) => record.id),
          source_ids: [...derivedSourceIds].sort(),
        },
      },
    ]);
  }

  explainRelationship(identifier: string): GraphEnvelope<unknown> {
    const query = { command: "explain", identifier };
    const resolution = this.resolveIdentifier(identifier);
    if (!resolution.record) return failure(query, resolution.diagnostics);
    if (resolution.record.record_kind !== "relationship") {
      return failure(query, [
        diagnostic("GRAPH_QUERY_FAMILY", "Explain requires a relationship ID."),
      ]);
    }
    const edge = this.edgeById.get(`edge:relationship:${resolution.record.id}`);
    if (!edge) return failure(query, [diagnostic("GRAPH_EDGE_UNKNOWN", resolution.record.id)]);
    return envelope(query, [
      {
        relationship: resolution.record,
        endpoints: { subject: edge.from, object: edge.to },
        predicate: edge.predicate,
        semantic_scope: edge.semantic_scope,
        confidence: edge.confidence,
        conditions: edge.conditions,
        evidence: {
          claim_ids: edge.claim_ids,
          source_ids: edge.source_ids,
          source_locations: edge.source_locations,
        },
        traversal: {
          eligible: edge.traversable,
          exclusion_reason: edge.traversal_exclusion_reason,
          multi_hop_eligible: edge.traversable,
        },
      },
    ]);
  }

  dependents(identifier: string): GraphEnvelope<unknown> {
    const query = { command: "dependents", identifier };
    const resolution = this.resolveIdentifier(identifier);
    if (!resolution.record) return failure(query, resolution.diagnostics);
    const id = resolution.record.id;
    const references = this.graph.edges
      .filter((edge) => edge.to === id || (edge.direction === "symmetric" && edge.from === id))
      .map((edge) => ({
        referencing_record_id: edge.from === id ? edge.to : edge.from,
        edge,
        reverse_semantic_interpretation: false,
      }))
      .sort((left, right) => compareEdges(left.edge, right.edge));
    return envelope(query, references);
  }

  list(family: string, filters: Record<string, string[]>): GraphEnvelope<unknown> {
    const query = { command: "list", family, filters };
    const records =
      family === "concepts"
        ? this.graph.concepts
        : family === "claims"
          ? this.graph.claims
          : family === "relationships"
            ? this.graph.relationships
            : family === "sources"
              ? this.graph.sources
              : undefined;
    if (!records)
      return failure(query, [diagnostic("GRAPH_QUERY_FAMILY", `Unknown index '${family}'.`)]);
    try {
      return envelope(query, filterRecords(records, family, filters));
    } catch (error) {
      return failure(query, [
        diagnostic("GRAPH_QUERY_FILTER", error instanceof Error ? error.message : String(error)),
      ]);
    }
  }

  structured(queryObject: unknown): GraphEnvelope<unknown> {
    const query = { command: "query", contract: queryObject };
    if (!isPlainObject(queryObject)) {
      return failure(query, [
        diagnostic("GRAPH_QUERY_SHAPE", "Structured query must be an object."),
      ]);
    }
    const nodeFilter = isPlainObject(queryObject.node) ? queryObject.node : {};
    const constraints = asArray(queryObject.relationships);
    if (constraints.some((constraint) => !isPlainObject(constraint))) {
      return failure(query, [
        diagnostic("GRAPH_QUERY_SHAPE", "Relationship constraints must be objects."),
      ]);
    }
    const traversableOnly = queryObject.traversable_only !== false;
    const diagnostics: GraphQueryDiagnostic[] = [];
    const normalizedConstraints = constraints.filter(isPlainObject).map((constraint, index) => {
      const predicate = asString(constraint.predicate);
      const target = asString(constraint.target);
      if (!predicate || !target) {
        diagnostics.push(
          diagnostic(
            "GRAPH_QUERY_SHAPE",
            `Relationship constraint ${index} needs predicate and target.`,
          ),
        );
        return undefined;
      }
      const resolution = this.resolveIdentifier(target);
      if (!resolution.record || resolution.record.record_kind !== "concept") {
        diagnostics.push(
          diagnostic(
            "GRAPH_QUERY_TARGET",
            `Constraint target '${target}' is not one exact concept.`,
          ),
        );
        return undefined;
      }
      return { predicate, targetId: resolution.record.id };
    });
    if (diagnostics.length > 0 || normalizedConstraints.some((item) => item === undefined)) {
      return failure(query, diagnostics);
    }
    const candidates = this.graph.concepts.filter(
      (concept) =>
        matchesAny(concept.type, asStringArray(nodeFilter.types)) &&
        matchesAny(concept.domain, asStringArray(nodeFilter.domains)) &&
        matchesAny(concept.status, asStringArray(nodeFilter.statuses)),
    );
    const results = candidates.filter((candidate) =>
      normalizedConstraints.every((constraint) =>
        this.relationshipEdges.some(
          (edge) =>
            constraint !== undefined &&
            edge.predicate === constraint.predicate &&
            (!traversableOnly || edge.traversable) &&
            edgeConnects(edge, candidate.id, constraint.targetId),
        ),
      ),
    );
    const resultDiagnostics =
      results.length === 0
        ? [
            diagnostic(
              "GRAPH_QUERY_EMPTY",
              `No concept satisfies all ${normalizedConstraints.length} exact relationship constraint(s).`,
            ),
          ]
        : [];
    return envelope(query, results, resultDiagnostics);
  }

  private resolveIdentifier(identifier: string): {
    record?: GraphIndexRecord;
    diagnostics: GraphQueryDiagnostic[];
  } {
    const byId = this.recordById.get(identifier);
    if (byId) return { record: byId, diagnostics: [] };
    const matches = this.graph.concepts.filter(
      (concept) => concept.human_key === identifier || concept.title === identifier,
    );
    if (matches.length === 1 && matches[0]) return { record: matches[0], diagnostics: [] };
    if (matches.length > 1) {
      return {
        diagnostics: [
          diagnostic("GRAPH_ID_AMBIGUOUS", `Exact identifier '${identifier}' is ambiguous.`),
        ],
      };
    }
    return {
      diagnostics: [diagnostic("GRAPH_ID_UNKNOWN", `Unknown graph identifier '${identifier}'.`)],
    };
  }

  private neighborResults(id: string, options: NeighborOptions): unknown[] {
    const direction = options.direction ?? "both";
    const predicates = new Set(options.predicates ?? []);
    return this.relationshipEdges
      .filter(
        (edge) =>
          (options.includeExcluded === true || edge.traversable) &&
          (predicates.size === 0 || predicates.has(edge.predicate)) &&
          edgeTouches(edge, id, direction),
      )
      .map((edge) => ({
        neighbor_id: edge.from === id ? edge.to : edge.from,
        orientation:
          edge.direction === "symmetric" ? "symmetric" : edge.from === id ? "outgoing" : "incoming",
        edge,
      }))
      .sort((left, right) => compareEdges(left.edge, right.edge));
  }

  private walk(
    start: string,
    maxDepth: number,
    options: TraverseOptions,
    destination: string | undefined,
  ): unknown[] {
    interface WalkState {
      nodeIds: string[];
      edges: GraphEdge[];
    }
    const queue: WalkState[] = [{ nodeIds: [start], edges: [] }];
    const results = new Map<string, unknown>();
    while (queue.length > 0) {
      const state = queue.shift();
      if (!state || state.edges.length >= maxDepth) continue;
      const current = state.nodeIds[state.nodeIds.length - 1] ?? start;
      const candidates = this.neighborResults(current, {
        direction: options.direction ?? "outgoing",
        ...(options.predicates ? { predicates: options.predicates } : {}),
        includeExcluded: false,
      });
      for (const candidate of candidates) {
        if (!isPlainObject(candidate) || !isPlainObject(candidate.edge)) continue;
        const nextId = asString(candidate.neighbor_id);
        const edge = candidate.edge as unknown as GraphEdge;
        if (!nextId || state.nodeIds.includes(nextId)) continue;
        const nextRecord = this.recordById.get(nextId);
        if (!nextRecord || nextRecord.record_kind !== "concept") continue;
        if (!matchesAny(nextRecord.type, options.conceptTypes ?? [])) continue;
        if (!matchesAny(nextRecord.domain, options.domains ?? [])) continue;
        const nextState: WalkState = {
          nodeIds: [...state.nodeIds, nextId],
          edges: [...state.edges, edge],
        };
        const result = pathResult(nextState.nodeIds, nextState.edges);
        const key = `${nextState.nodeIds.join(">")}|${nextState.edges.map((item) => item.id).join(">")}`;
        if (!destination || nextId === destination) results.set(key, result);
        if (!destination || nextId !== destination) queue.push(nextState);
      }
    }
    return [...results.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => value);
  }
}

function filterRecords(
  records: readonly GraphIndexRecord[],
  family: string,
  filters: Record<string, string[]>,
): GraphIndexRecord[] {
  const aliases: Record<string, Record<string, string>> = {
    concepts: {
      type: "type",
      domain: "domain",
      status: "status",
      title: "title",
      human_key: "human_key",
    },
    claims: {
      id: "id",
      subject: "subject",
      predicate: "predicate",
      object: "object.record_id",
      claim_type: "claim_type",
      semantic_scope: "semantic_scope",
      confidence: "confidence",
      status: "status",
      source: "sources",
      applicable_concept: "applicable_concept_ids",
      normative_force: "normative.force",
    },
    relationships: {
      id: "id",
      subject: "subject",
      object: "object",
      predicate: "predicate",
      status: "status",
      confidence: "confidence",
      semantic_scope: "semantic_scope",
      traversal_eligible: "traversal_eligible",
      supporting_claim: "evidence",
      source: "direct_source_ids",
    },
    sources: {
      id: "id",
      title: "title",
      source_type: "source_type",
      status: "status",
      publisher: "publisher",
      authority: "authority_level",
      domain: "domains",
    },
  };
  const permitted = aliases[family] ?? aliases.claims ?? {};
  for (const key of Object.keys(filters)) {
    if (!permitted[key]) throw new Error(`Unsupported ${family} filter '${key}'.`);
  }
  return records.filter((record) =>
    Object.entries(filters).every(([key, expected]) => {
      const value = readPath(record, permitted[key] ?? key);
      return expected.length === 0 || expected.some((item) => exactValueMatch(value, item));
    }),
  );
}

function readPath(value: unknown, dotted: string): unknown {
  let current = value;
  for (const key of dotted.split(".")) {
    if (!isPlainObject(current)) return undefined;
    current = current[key];
  }
  return current;
}

function exactValueMatch(value: unknown, expected: string): boolean {
  if (Array.isArray(value)) return value.includes(expected);
  if (typeof value === "boolean") return String(value) === expected;
  return value === expected;
}

function checkedDepth(value: number | undefined): number {
  const depth = value ?? DEFAULT_MAX_DEPTH;
  if (!Number.isInteger(depth) || depth < 1 || depth > HARD_MAX_DEPTH) {
    throw new Error(
      `GRAPH_DEPTH_INVALID Maximum depth must be an integer from 1 to ${HARD_MAX_DEPTH}.`,
    );
  }
  return depth;
}

function edgeTouches(edge: GraphEdge, id: string, direction: GraphDirection): boolean {
  if (edge.direction === "symmetric") return edge.from === id || edge.to === id;
  return (
    (direction !== "incoming" && edge.from === id) || (direction !== "outgoing" && edge.to === id)
  );
}

function edgeConnects(edge: GraphEdge, from: string, to: string): boolean {
  if (edge.direction === "symmetric") {
    return (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from);
  }
  return edge.from === from && edge.to === to;
}

function pathResult(nodeIds: string[], edges: GraphEdge[]): Record<string, unknown> {
  return {
    node_ids: nodeIds,
    relationship_ids: edges.map((edge) => edge.relationship_id),
    predicates: edges.map((edge) => edge.predicate),
    depth: edges.length,
    edges,
  };
}

function compareEdges(left: GraphEdge, right: GraphEdge): number {
  return (
    left.from.localeCompare(right.from) ||
    left.predicate.localeCompare(right.predicate) ||
    left.to.localeCompare(right.to) ||
    left.id.localeCompare(right.id)
  );
}

function matchesAny(value: unknown, filters: readonly string[]): boolean {
  return filters.length === 0 || (typeof value === "string" && filters.includes(value));
}

function diagnostic(code: string, message: string): GraphQueryDiagnostic {
  return { code, message };
}

function envelope<T>(
  query: Record<string, unknown>,
  results: T[],
  diagnostics: GraphQueryDiagnostic[] = [],
): GraphEnvelope<T> {
  return {
    query,
    result_count: results.length,
    results,
    diagnostics,
    graph_contract_version: GRAPH_CONTRACT_VERSION,
  };
}

function failure<T>(
  query: Record<string, unknown>,
  diagnostics: GraphQueryDiagnostic[],
): GraphEnvelope<T> {
  return envelope<T>(query, [], diagnostics);
}
