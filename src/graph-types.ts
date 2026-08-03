export const GRAPH_CONTRACT_VERSION = 1 as const;
export const GRAPH_GENERATOR_VERSION = 1 as const;
export const DEFAULT_MAX_DEPTH = 3;
export const HARD_MAX_DEPTH = 8;

export type GraphNodeFamily = "concept" | "claim" | "source" | "relationship";
export type GraphEdgeFamily =
  | "relationship"
  | "concept-declares-claim"
  | "claim-supported-by-source"
  | "claim-derived-from-claim"
  | "claim-applicable-to-concept"
  | "relationship-supported-by-claim";

export interface GraphNode {
  id: string;
  family: GraphNodeFamily;
  source_path: string;
  status: string | null;
  title: string | null;
}

export interface GraphEdge {
  id: string;
  family: GraphEdgeFamily;
  from: string;
  to: string;
  predicate: string;
  relationship_id: string | null;
  direction: "directed" | "symmetric";
  status: string | null;
  confidence: string | null;
  strength: string | null;
  semantic_scope: string | null;
  conditions: unknown[];
  exceptions: string[];
  claim_ids: string[];
  source_ids: string[];
  source_locations: unknown[];
  traversable: boolean;
  traversal_exclusion_reason: string | null;
  source_path: string;
}

export interface GraphIndexRecord extends Record<string, unknown> {
  id: string;
  record_kind: GraphNodeFamily;
  source_path: string;
}

export interface GraphEnvelope<T> {
  query: Record<string, unknown>;
  result_count: number;
  results: T[];
  diagnostics: GraphQueryDiagnostic[];
  graph_contract_version: number;
}

export interface GraphQueryDiagnostic {
  code: string;
  message: string;
}

export interface GraphArtifacts {
  files: Map<string, string>;
  nodes: GraphNode[];
  edges: GraphEdge[];
  concepts: GraphIndexRecord[];
  claims: GraphIndexRecord[];
  sources: GraphIndexRecord[];
  relationships: GraphIndexRecord[];
  manifest: Record<string, unknown>;
  traversalPolicy: Record<string, unknown>;
}

export interface GraphValidationDiagnostic {
  code: string;
  path: string;
  message: string;
}
