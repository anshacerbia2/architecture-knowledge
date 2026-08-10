import { createHash } from "node:crypto";

import { asArray, asString, asStringArray, isPlainObject } from "./io.js";
import { serializeGraphValue } from "./graph-projector.js";
import type { GraphArtifacts, GraphIndexRecord } from "./graph-types.js";
import {
  MAX_SEMANTIC_UNIT_TOKENS,
  PRODUCTION_EMBEDDING,
  RETRIEVAL_CHUNKING_VERSION,
  RETRIEVAL_NORMALIZATION_VERSION,
} from "./retrieval-config.js";
import {
  RETRIEVAL_CONTRACT_VERSION,
  RETRIEVAL_GENERATOR_VERSION,
  RETRIEVAL_UNIT_CONTRACT_VERSION,
  type RetrievalArtifacts,
  type RetrievalCitation,
  type RetrievalManifest,
  type RetrievalUnit,
  type RetrievalUnitKind,
} from "./retrieval-types.js";

const CONCEPT_SECTIONS: Array<[string, string]> = [
  ["applicable_when", "Applicability"],
  ["avoid_when", "Avoidance"],
  ["forces", "Forces"],
  ["constraints", "Constraints"],
  ["assumptions", "Assumptions"],
  ["benefits", "Benefits"],
  ["tradeoffs", "Trade-offs"],
  ["risks", "Risks"],
  ["failure_modes", "Failure Modes"],
  ["alternatives", "Alternatives"],
  ["examples", "Examples"],
  ["counterexamples", "Counterexamples"],
  ["security_implications", "Security Implications"],
  ["operational_implications", "Operational Implications"],
  ["data_implications", "Data Implications"],
  ["verification", "Verification"],
  ["evolution_triggers", "Evolution Triggers"],
];

export function buildRetrievalArtifacts(graph: GraphArtifacts): RetrievalArtifacts {
  const sourceById = new Map(graph.sources.map((record) => [record.id, record]));
  const units: RetrievalUnit[] = [];
  for (const concept of graph.concepts) {
    units.push(...conceptUnits(concept, sourceById));
  }
  for (const claim of graph.claims) units.push(claimUnit(claim, sourceById));
  for (const relationship of graph.relationships) {
    units.push(relationshipUnit(relationship, sourceById));
  }
  for (const source of graph.sources) units.push(sourceUnit(source, graph.claims));
  units.sort((left, right) => left.unit_id.localeCompare(right.unit_id));
  assertUniqueUnits(units);

  const graphFingerprint = asString(graph.manifest.input_fingerprint);
  if (!graphFingerprint) throw new Error("RETRIEVAL_GRAPH_FINGERPRINT_MISSING");
  const governedInputHash = hash(
    serializeGraphValue({
      graph_input_fingerprint: graphFingerprint,
      unit_content: units.map((unit) => [unit.unit_id, unit.content_hash]),
    }),
  );
  const inventory = ["generated/retrieval/manifest.json", "generated/retrieval/units.json"];
  const manifestWithoutRoot = {
    retrieval_contract_version: RETRIEVAL_CONTRACT_VERSION,
    retrieval_unit_contract_version: RETRIEVAL_UNIT_CONTRACT_VERSION,
    generator_version: RETRIEVAL_GENERATOR_VERSION,
    graph_contract_version: Number(graph.manifest.graph_contract_version),
    graph_input_fingerprint: graphFingerprint,
    governed_input_hash: governedInputHash,
    unit_counts: countKinds(units),
    unit_count: units.length,
    estimated_token_total: units.reduce((sum, unit) => sum + unit.estimated_tokens, 0),
    embedding_contract: PRODUCTION_EMBEDDING,
    normalization_version: RETRIEVAL_NORMALIZATION_VERSION,
    chunking_version: RETRIEVAL_CHUNKING_VERSION,
    artifact_inventory: inventory,
    units: units.map((unit) => ({
      unit_id: unit.unit_id,
      record_id: unit.record_id,
      unit_kind: unit.unit_kind,
      content_hash: unit.content_hash,
    })),
  };
  const manifest: RetrievalManifest = {
    ...manifestWithoutRoot,
    manifest_root_hash: hash(serializeGraphValue(manifestWithoutRoot)),
  };
  const files = new Map<string, string>([
    [
      "generated/retrieval/units.json",
      serializeGraphValue({
        retrieval_contract_version: RETRIEVAL_CONTRACT_VERSION,
        artifact_type: "retrieval-units",
        units,
      }),
    ],
    [
      "generated/retrieval/manifest.json",
      serializeGraphValue({ ...manifest, artifact_type: "retrieval-manifest" }),
    ],
  ]);
  return { units, manifest, files };
}

function conceptUnits(
  concept: GraphIndexRecord,
  sourceById: ReadonlyMap<string, GraphIndexRecord>,
): RetrievalUnit[] {
  const citations = citationsFor(asStringArray(concept.sources), [], sourceById);
  const metadata = conceptMetadata(concept);
  const overview = compactLines([
    `Concept: ${concept.id} ${asString(concept.title) ?? ""}`,
    `Human key: ${asString(concept.human_key) ?? ""}`,
    `Aliases: ${asStringArray(concept.aliases).join(", ")}`,
    `Summary: ${asString(concept.summary) ?? ""}`,
    `Problem: ${asString(concept.problem) ?? ""}`,
    `Context: ${asString(concept.context) ?? ""}`,
    `Intent: ${asString(concept.intent) ?? ""}`,
    `Type: ${asString(concept.type) ?? ""}`,
    `Domain: ${asString(concept.domain) ?? ""}`,
    `Status: ${asString(concept.status) ?? ""}`,
    `Tags: ${asStringArray(concept.tags).join(", ")}`,
  ]);
  const units: RetrievalUnit[] = [
    createUnit({
      kind: "concept-overview",
      record: concept,
      conceptId: concept.id,
      sectionKey: "overview",
      ordinal: 0,
      title: `${asString(concept.title) ?? concept.id} — Overview`,
      text: overview,
      metadata,
      citations,
    }),
  ];
  for (const [field, label] of CONCEPT_SECTIONS) {
    const entries = asArray(concept[field]);
    if (entries.length === 0) continue;
    const text = compactLines([
      `Concept: ${concept.id} ${asString(concept.title) ?? ""}`,
      `${label}:`,
      ...entries.map((entry) => `- ${renderValue(entry)}`),
    ]);
    const parts = splitSemanticText(text, MAX_SEMANTIC_UNIT_TOKENS);
    for (const [ordinal, part] of parts.entries()) {
      units.push(
        createUnit({
          kind: "concept-section",
          record: concept,
          conceptId: concept.id,
          sectionKey: field,
          ordinal,
          title: `${asString(concept.title) ?? concept.id} — ${label}`,
          text: part,
          metadata: { ...metadata, section_field: field },
          citations,
        }),
      );
    }
  }
  return units;
}

function claimUnit(
  claim: GraphIndexRecord,
  sourceById: ReadonlyMap<string, GraphIndexRecord>,
): RetrievalUnit {
  const locations = asArray(claim.source_locations);
  const citations = citationsFor(asStringArray(claim.sources), locations, sourceById);
  const conceptId = asString(claim.subject);
  const title = `Claim ${claim.id}`;
  const text = compactLines([
    `${title}: ${asString(claim.statement) ?? ""}`,
    `Subject: ${conceptId ?? ""}`,
    `Predicate: ${asString(claim.predicate) ?? ""}`,
    `Object: ${renderValue(claim.object)}`,
    `Claim type: ${asString(claim.claim_type) ?? ""}`,
    `Confidence: ${asString(claim.confidence) ?? ""}`,
    `Semantic scope: ${asString(claim.semantic_scope) ?? ""}`,
    `Conditions: ${renderValue(claim.conditions)}`,
    `Exceptions: ${renderValue(claim.exceptions)}`,
    `Normative: ${renderValue(claim.normative)}`,
    `Applicable concepts: ${asStringArray(claim.applicable_concept_ids).join(", ")}`,
    `Sources: ${asStringArray(claim.sources).join(", ")}`,
    `Source locators: ${renderValue(locations)}`,
    `Derived from claims: ${asStringArray(claim.derived_from_claims).join(", ")}`,
  ]);
  if (estimateTokens(text) > MAX_SEMANTIC_UNIT_TOKENS) {
    throw new Error(`RETRIEVAL_ATOMIC_CLAIM_OVERSIZE ${claim.id}`);
  }
  return createUnit({
    kind: "claim",
    record: claim,
    conceptId: conceptId ?? null,
    sectionKey: "claim",
    ordinal: 0,
    title,
    text,
    metadata: {
      claim_type: claim.claim_type ?? null,
      normative_force: isPlainObject(claim.normative) ? (claim.normative.force ?? null) : null,
      applicable_concept_ids: asStringArray(claim.applicable_concept_ids),
      sources: asStringArray(claim.sources),
      source_locations: locations,
      conditions: asArray(claim.conditions),
      exceptions: asArray(claim.exceptions),
      derived_from_claims: asStringArray(claim.derived_from_claims),
      subject: claim.subject ?? null,
      predicate: claim.predicate ?? null,
      object: claim.object ?? null,
    },
    citations,
  });
}

function relationshipUnit(
  relationship: GraphIndexRecord,
  sourceById: ReadonlyMap<string, GraphIndexRecord>,
): RetrievalUnit {
  const locations = asArray(relationship.evidence_source_locations);
  const sourceIds = asStringArray(relationship.direct_source_ids);
  return createUnit({
    kind: "relationship",
    record: relationship,
    conceptId: asString(relationship.subject) ?? null,
    sectionKey: "relationship",
    ordinal: 0,
    title: `Relationship ${relationship.id}`,
    text: compactLines([
      `Relationship ${relationship.id}: ${String(relationship.subject)} ${String(relationship.predicate)} ${String(relationship.object)}`,
      `Direction: ${asString(relationship.direction) ?? ""}`,
      `Confidence: ${asString(relationship.confidence) ?? ""}`,
      `Strength: ${asString(relationship.strength) ?? ""}`,
      `Semantic scope: ${asString(relationship.semantic_scope) ?? ""}`,
      `Conditions: ${renderValue(relationship.conditions)}`,
      `Supporting claims: ${asStringArray(relationship.evidence).join(", ")}`,
      `Source locators: ${renderValue(locations)}`,
      `Traversal eligible: ${String(relationship.traversal_eligible === true)}`,
      `Traversal exclusion reason: ${asString(relationship.traversal_exclusion_reason) ?? ""}`,
    ]),
    metadata: {
      subject: relationship.subject ?? null,
      object: relationship.object ?? null,
      predicate: relationship.predicate ?? null,
      direction: relationship.direction ?? null,
      strength: relationship.strength ?? null,
      conditions: asArray(relationship.conditions),
      supporting_claim_ids: asStringArray(relationship.evidence),
      source_locations: locations,
      traversal_eligible: relationship.traversal_eligible === true,
      traversal_exclusion_reason: relationship.traversal_exclusion_reason ?? null,
    },
    citations: citationsFor(sourceIds, locations, sourceById),
  });
}

function sourceUnit(source: GraphIndexRecord, claims: GraphIndexRecord[]): RetrievalUnit {
  const locators = claims
    .filter((claim) => asStringArray(claim.sources).includes(source.id))
    .flatMap((claim) =>
      asArray(claim.source_locations).filter(
        (location) => isPlainObject(location) && location.source_id === source.id,
      ),
    );
  return createUnit({
    kind: "source",
    record: source,
    conceptId: null,
    sectionKey: "metadata",
    ordinal: 0,
    title: `Source ${source.id}: ${asString(source.title) ?? ""}`,
    text: compactLines([
      `Source ${source.id}: ${asString(source.title) ?? ""}`,
      `Publisher: ${asString(source.publisher) ?? ""}`,
      `Authority: ${asString(source.authority_level) ?? ""}`,
      `Type: ${asString(source.source_type) ?? ""}`,
      `Domains: ${asStringArray(source.domains).join(", ")}`,
      `Status: ${asString(source.status) ?? ""}`,
      `Reference: ${asString(source.url) ?? ""}`,
      `Admission notes: ${asString(source.notes) ?? ""}`,
      `Usage boundary: ${asString(source.license_or_usage_notes) ?? ""}`,
      `Governed claim locators: ${renderValue(locators)}`,
    ]),
    metadata: {
      authority_level: source.authority_level ?? null,
      source_type: source.source_type ?? null,
      domains: asStringArray(source.domains),
      url: source.url ?? null,
      claim_locators: locators,
      quality: source.quality ?? null,
    },
    citations: [citation(source, locators)],
  });
}

function createUnit(input: {
  kind: RetrievalUnitKind;
  record: GraphIndexRecord;
  conceptId: string | null;
  sectionKey: string;
  ordinal: number;
  title: string;
  text: string;
  metadata: Record<string, unknown>;
  citations: RetrievalCitation[];
}): RetrievalUnit {
  if (!input.text.trim()) throw new Error(`RETRIEVAL_UNIT_EMPTY ${input.record.id}`);
  const unitId = `ru:${input.record.id}:${input.kind}:${input.sectionKey}:${input.ordinal}`;
  const metadata = {
    ...input.metadata,
    record_kind: input.record.record_kind,
    record_id: input.record.id,
    concept_id: input.conceptId,
    title: input.record.title ?? null,
    human_key: input.record.human_key ?? null,
    aliases: asStringArray(input.record.aliases),
    concept_type: input.record.type ?? null,
    domain: input.record.domain ?? null,
    status: input.record.status ?? null,
    semantic_scope: input.record.semantic_scope ?? null,
    confidence: input.record.confidence ?? null,
  };
  const normalizedText = normalizeRetrievalText(input.text);
  return {
    retrieval_unit_contract_version: RETRIEVAL_UNIT_CONTRACT_VERSION,
    unit_id: unitId,
    unit_kind: input.kind,
    record_id: input.record.id,
    concept_id: input.conceptId,
    section_key: input.sectionKey,
    ordinal: input.ordinal,
    title: input.title,
    retrieval_text: normalizedText,
    content_hash: hash(
      serializeGraphValue({ text: normalizedText, metadata, citations: input.citations }),
    ),
    estimated_tokens: estimateTokens(normalizedText),
    metadata,
    source_path: asString(input.record.source_path) ?? "",
    lifecycle_status: asString(input.record.status) ?? null,
    semantic_scope: asString(input.record.semantic_scope) ?? null,
    confidence: asString(input.record.confidence) ?? null,
    citations: input.citations,
  };
}

export function splitSemanticText(text: string, maxTokens: number): string[] {
  if (!Number.isInteger(maxTokens) || maxTokens < 1) {
    throw new Error("RETRIEVAL_UNIT_LIMIT_INVALID");
  }
  const normalized = normalizeRetrievalText(text);
  if (estimateTokens(normalized) <= maxTokens) return [normalized];
  const maxChars = maxTokens * 4;
  const paragraphs = normalized.split("\n");
  const parts: string[] = [];
  let current = "";
  const push = (): void => {
    if (current) parts.push(current);
    current = "";
  };
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      push();
      for (let offset = 0; offset < paragraph.length; offset += maxChars) {
        parts.push(paragraph.slice(offset, offset + maxChars));
      }
      continue;
    }
    const candidate = current ? `${current}\n${paragraph}` : paragraph;
    if (candidate.length > maxChars) push();
    current = current ? `${current}\n${paragraph}` : paragraph;
  }
  push();
  return parts;
}

export function normalizeRetrievalText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .trim();
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function citationsFor(
  sourceIds: string[],
  locations: unknown[],
  sourceById: ReadonlyMap<string, GraphIndexRecord>,
): RetrievalCitation[] {
  return [...new Set(sourceIds)].sort().map((sourceId) => {
    const source = sourceById.get(sourceId);
    if (!source) throw new Error(`RETRIEVAL_SOURCE_UNRESOLVED ${sourceId}`);
    return citation(
      source,
      locations.filter((item) => isPlainObject(item) && item.source_id === sourceId),
    );
  });
}

function citation(source: GraphIndexRecord, locators: unknown[]): RetrievalCitation {
  return {
    source_id: source.id,
    title: asString(source.title) ?? null,
    url: asString(source.url) ?? null,
    locators,
  };
}

function conceptMetadata(concept: GraphIndexRecord): Record<string, unknown> {
  return {
    aliases: asStringArray(concept.aliases),
    tags: asStringArray(concept.tags),
    human_key: concept.human_key ?? null,
    concept_type: concept.type ?? null,
    domain: concept.domain ?? null,
    sources: asStringArray(concept.sources),
  };
}

function countKinds(units: RetrievalUnit[]): Record<RetrievalUnitKind, number> {
  const counts: Record<RetrievalUnitKind, number> = {
    "concept-overview": 0,
    "concept-section": 0,
    claim: 0,
    relationship: 0,
    source: 0,
  };
  for (const unit of units) counts[unit.unit_kind] += 1;
  return counts;
}

function assertUniqueUnits(units: RetrievalUnit[]): void {
  const ids = new Set<string>();
  for (const unit of units) {
    if (ids.has(unit.unit_id)) throw new Error(`RETRIEVAL_UNIT_DUPLICATE ${unit.unit_id}`);
    ids.add(unit.unit_id);
  }
}

function renderValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function compactLines(lines: string[]): string {
  return lines.filter((line) => !line.endsWith(": ")).join("\n");
}

function hash(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
