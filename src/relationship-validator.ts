import { asArray, asString, isPlainObject } from "./io.js";
import { diagnostic, type Diagnostic } from "./diagnostics.js";
import type { RecordEntry, RepositoryModel } from "./model.js";

export interface RelationshipCycle {
  predicate: string;
  policy: "forbidden" | "report-only" | "allowed";
  nodes: string[];
}

export interface RelationshipAnalysis {
  diagnostics: Diagnostic[];
  orphanRecords: { id: string; path: string }[];
  cycles: RelationshipCycle[];
  duplicateRelationships: { signature: string; ids: string[] }[];
  conflictingRelationships: { pair: string; predicates: string[]; ids: string[] }[];
}

export function validateRelationships(model: RepositoryModel): RelationshipAnalysis {
  const diagnostics: Diagnostic[] = [];
  diagnostics.push(...validateCyclePolicy(model));
  const byId = new Map(model.records.map((record) => [record.id, record]));
  const claimIds = new Set(model.claims.map((claim) => claim.id));
  const defaults = model.ontology.relationshipDefaults;
  const predicateByKey = new Map(
    model.ontology.relationshipTypes
      .map((item) => [asString(item.key), item] as const)
      .filter((entry): entry is readonly [string, Record<string, unknown>] => Boolean(entry[0])),
  );
  const signatures = new Map<string, RecordEntry[]>();
  const endpointPairs = new Map<string, RecordEntry[]>();

  for (const relationship of model.relationships) {
    const subjectId = asString(relationship.data.subject);
    const objectId = asString(relationship.data.object);
    const predicate = asString(relationship.data.predicate);
    if (!subjectId || !objectId || !predicate) {
      continue;
    }
    const definition = predicateByKey.get(predicate);
    if (!definition) {
      diagnostics.push(
        diagnostic(
          "REL_PREDICATE_UNKNOWN",
          "error",
          relationship.path,
          `Predicate '${predicate}' is not registered.`,
        ),
      );
      continue;
    }
    const subject = byId.get(subjectId);
    const object = byId.get(objectId);
    if (!subject || !object) {
      continue;
    }
    validateEndpoint("subject", subject, definition, relationship, diagnostics);
    validateEndpoint("object", object, definition, relationship, diagnostics);

    const direction = asString(relationship.data.direction);
    const expectedDirection = asString(definition.direction);
    if (direction !== expectedDirection) {
      diagnostics.push(
        diagnostic(
          "REL_DIRECTION",
          "error",
          relationship.path,
          `Predicate '${predicate}' requires '${expectedDirection}' direction, found '${direction}'.`,
        ),
      );
    }
    const selfAllowed = definition.self_relation_allowed ?? defaults.self_relation_allowed ?? false;
    if (subjectId === objectId && selfAllowed !== true) {
      diagnostics.push(
        diagnostic(
          "REL_SELF",
          "error",
          relationship.path,
          `Predicate '${predicate}' does not allow self-relations.`,
        ),
      );
    }
    if (expectedDirection === "symmetric" && subjectId.localeCompare(objectId) >= 0) {
      diagnostics.push(
        diagnostic(
          "REL_SYMMETRIC_ORDER",
          "error",
          relationship.path,
          `Symmetric relationship endpoints must be stored in ascending ID order.`,
        ),
      );
    }
    const conditionsRequired =
      definition.conditions_required ?? defaults.conditions_required ?? false;
    if (conditionsRequired === true && asArray(relationship.data.conditions).length === 0) {
      diagnostics.push(
        diagnostic(
          "REL_CONDITIONS_REQUIRED",
          "error",
          relationship.path,
          `Predicate '${predicate}' requires structured conditions.`,
        ),
      );
    }
    const evidenceRequired =
      definition.evidence_claims_required ?? defaults.evidence_claims_required ?? true;
    const evidence = asArray(relationship.data.evidence);
    if (evidenceRequired === true && evidence.length === 0) {
      diagnostics.push(
        diagnostic(
          "REL_EVIDENCE_REQUIRED",
          "error",
          relationship.path,
          `Predicate '${predicate}' requires claim evidence.`,
        ),
      );
    }
    for (const evidenceId of evidence) {
      if (typeof evidenceId !== "string" || !claimIds.has(evidenceId)) {
        diagnostics.push(
          diagnostic(
            "REL_EVIDENCE_CLAIM",
            "error",
            relationship.path,
            `Relationship evidence '${String(evidenceId)}' must resolve to a claim record.`,
          ),
        );
      }
    }
    if (predicate === "related-to") {
      diagnostics.push(
        diagnostic(
          "REL_RELATED_TO_SUSPICIOUS",
          "warning",
          relationship.path,
          "Use of 'related-to' requires documented justification that no precise predicate applies.",
        ),
      );
    }
    if (predicate === "influences" && asArray(relationship.data.conditions).length === 0) {
      diagnostics.push(
        diagnostic(
          "REL_INFLUENCES_UNCONDITIONAL",
          "error",
          relationship.path,
          "An 'influences' relationship cannot be unconditional.",
        ),
      );
    }

    const signature = `${subjectId}|${predicate}|${objectId}|${stableStringify(relationship.data.conditions)}`;
    const signatureItems = signatures.get(signature) ?? [];
    signatureItems.push(relationship);
    signatures.set(signature, signatureItems);
    const pair = canonicalPair(subjectId, objectId);
    const pairItems = endpointPairs.get(pair) ?? [];
    pairItems.push(relationship);
    endpointPairs.set(pair, pairItems);
  }

  const duplicateRelationships: RelationshipAnalysis["duplicateRelationships"] = [];
  for (const [signature, entries] of signatures) {
    if (entries.length > 1) {
      const ids = entries.map((entry) => entry.id).sort();
      duplicateRelationships.push({ signature, ids });
      diagnostics.push(
        diagnostic(
          "REL_DUPLICATE",
          "error",
          entries[0]?.path ?? "relationships/",
          `Duplicate relationship '${signature}' appears as ${ids.join(", ")}.`,
        ),
      );
    }
  }

  const conflictingRelationships: RelationshipAnalysis["conflictingRelationships"] = [];
  for (const [pair, entries] of endpointPairs) {
    const predicates = new Set(
      entries
        .map((entry) => asString(entry.data.predicate))
        .filter((item): item is string => Boolean(item)),
    );
    const conflicts =
      (predicates.has("improves") && predicates.has("degrades")) ||
      (predicates.has("compatible-with") && predicates.has("conflicts-with"));
    if (conflicts) {
      const item = {
        pair,
        predicates: [...predicates].sort(),
        ids: entries.map((entry) => entry.id).sort(),
      };
      conflictingRelationships.push(item);
      diagnostics.push(
        diagnostic(
          "REL_CONFLICTING",
          "warning",
          entries[0]?.path ?? "relationships/",
          `Potentially conflicting predicates for '${pair}': ${item.predicates.join(", ")}.`,
        ),
      );
    }
    if (predicates.has("related-to") && predicates.size > 1) {
      diagnostics.push(
        diagnostic(
          "REL_IMPRECISE_DUPLICATE",
          "error",
          entries.find((entry) => entry.data.predicate === "related-to")?.path ?? "relationships/",
          `'related-to' duplicates a more precise relationship for '${pair}'.`,
        ),
      );
    }
    if (predicates.has("is-a") && predicates.has("specializes")) {
      diagnostics.push(
        diagnostic(
          "REL_CLASSIFICATION_AMBIGUOUS",
          "error",
          entries[0]?.path ?? "relationships/",
          `'is-a' and 'specializes' are both asserted for '${pair}'. Select the semantically correct predicate.`,
        ),
      );
    }
  }

  validateExplicitInverses(model.relationships, predicateByKey, diagnostics);
  const cycles = findRelationshipCycles(model);
  for (const cycle of cycles) {
    if (cycle.policy === "forbidden") {
      diagnostics.push(
        diagnostic(
          "REL_CYCLE_FORBIDDEN",
          "error",
          "relationships/",
          `Predicate '${cycle.predicate}' forms a forbidden cycle: ${cycle.nodes.join(" -> ")}.`,
        ),
      );
    } else if (cycle.policy === "report-only") {
      diagnostics.push(
        diagnostic(
          "REL_CYCLE_REPORTED",
          "warning",
          "relationships/",
          `Predicate '${cycle.predicate}' forms a reported cycle: ${cycle.nodes.join(" -> ")}.`,
        ),
      );
    }
  }

  const connected = new Set<string>();
  for (const relationship of model.relationships) {
    const subject = asString(relationship.data.subject);
    const object = asString(relationship.data.object);
    if (subject) connected.add(subject);
    if (object) connected.add(object);
  }
  const orphanRecords = model.concepts
    .filter((concept) => !connected.has(concept.id))
    .map((concept) => ({ id: concept.id, path: concept.path }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    diagnostics,
    orphanRecords,
    cycles,
    duplicateRelationships,
    conflictingRelationships,
  };
}

function validateEndpoint(
  endpoint: "subject" | "object",
  record: RecordEntry,
  definition: Record<string, unknown>,
  relationship: RecordEntry,
  diagnostics: Diagnostic[],
): void {
  const allowedKinds = asArray(definition[`${endpoint}_kinds`]).filter(
    (item): item is string => typeof item === "string",
  );
  if (!allowedKinds.includes(record.recordKind)) {
    diagnostics.push(
      diagnostic(
        "REL_ENDPOINT_KIND",
        "error",
        relationship.path,
        `${endpoint} '${record.id}' has record kind '${record.recordKind}', expected one of ${allowedKinds.join(", ")}.`,
      ),
    );
  }
  if (endpoint === "object" && record.recordKind === "concept") {
    const allowedTypes = asArray(definition.object_concept_types).filter(
      (item): item is string => typeof item === "string",
    );
    const actualType = asString(record.data.type);
    if (allowedTypes.length > 0 && (!actualType || !allowedTypes.includes(actualType))) {
      diagnostics.push(
        diagnostic(
          "REL_ENDPOINT_CONCEPT_TYPE",
          "error",
          relationship.path,
          `object '${record.id}' has concept type '${actualType ?? "missing"}', expected one of ${allowedTypes.join(", ")}.`,
        ),
      );
    }
  }
}

function validateExplicitInverses(
  relationships: readonly RecordEntry[],
  predicateByKey: Map<string, Record<string, unknown>>,
  diagnostics: Diagnostic[],
): void {
  for (const relationship of relationships) {
    const predicate = asString(relationship.data.predicate);
    const subject = asString(relationship.data.subject);
    const object = asString(relationship.data.object);
    if (!predicate || !subject || !object) continue;
    const definition = predicateByKey.get(predicate);
    const inverseKeys = [
      asString(definition?.inverse),
      ...asArray(definition?.inverse_of).filter((item): item is string => typeof item === "string"),
    ].filter((item): item is string => Boolean(item));
    const explicitInverse = relationships.find(
      (candidate) =>
        candidate.data.subject === object &&
        candidate.data.object === subject &&
        inverseKeys.includes(asString(candidate.data.predicate) ?? ""),
    );
    if (
      explicitInverse &&
      (explicitInverse.data.strength !== relationship.data.strength ||
        explicitInverse.data.confidence !== relationship.data.confidence)
    ) {
      diagnostics.push(
        diagnostic(
          "REL_INVERSE_INCONSISTENT",
          "error",
          explicitInverse.path,
          `Explicit inverse of '${relationship.id}' has different strength or confidence.`,
        ),
      );
    }
  }
}

function findRelationshipCycles(model: RepositoryModel): RelationshipCycle[] {
  const policies = isPlainObject(model.ontology.validationPolicies.relationship_cycles)
    ? model.ontology.validationPolicies.relationship_cycles
    : {};
  const policyByPredicate = new Map<string, RelationshipCycle["policy"]>();
  for (const predicate of asArray(policies.forbidden)) {
    if (typeof predicate === "string") policyByPredicate.set(predicate, "forbidden");
  }
  for (const predicate of asArray(policies.report_only)) {
    if (typeof predicate === "string") policyByPredicate.set(predicate, "report-only");
  }
  for (const predicate of asArray(policies.allowed)) {
    if (typeof predicate === "string") policyByPredicate.set(predicate, "allowed");
  }
  const cycles: RelationshipCycle[] = [];
  for (const [predicate, policy] of policyByPredicate) {
    const edges = model.relationships
      .filter((relationship) => relationship.data.predicate === predicate)
      .map((relationship) => ({
        from: asString(relationship.data.subject),
        to: asString(relationship.data.object),
      }))
      .filter((edge): edge is { from: string; to: string } => Boolean(edge.from && edge.to));
    for (const nodes of directedCycles(edges)) {
      cycles.push({ predicate, policy, nodes });
    }
  }
  return cycles.sort(
    (left, right) =>
      left.predicate.localeCompare(right.predicate) ||
      left.nodes.join("|").localeCompare(right.nodes.join("|")),
  );
}

function directedCycles(edges: readonly { from: string; to: string }[]): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const targets = adjacency.get(edge.from) ?? [];
    targets.push(edge.to);
    adjacency.set(edge.from, [...new Set(targets)].sort());
  }
  const found = new Map<string, string[]>();
  const visiting = new Set<string>();
  const stack: string[] = [];
  function visit(node: string): void {
    visiting.add(node);
    stack.push(node);
    for (const target of adjacency.get(node) ?? []) {
      const index = stack.indexOf(target);
      if (index >= 0) {
        const raw = [...stack.slice(index), target];
        const canonical = canonicalCycle(raw);
        found.set(canonical.join("|"), canonical);
      } else if (!visiting.has(target)) {
        visit(target);
      }
    }
    stack.pop();
    visiting.delete(node);
  }
  for (const node of [...adjacency.keys()].sort()) {
    visit(node);
  }
  return [...found.values()].sort((left, right) => left.join("|").localeCompare(right.join("|")));
}

function canonicalCycle(nodes: string[]): string[] {
  const cycle = nodes.slice(0, -1);
  const rotations = cycle.map((_, index) => [...cycle.slice(index), ...cycle.slice(0, index)]);
  rotations.sort((left, right) => left.join("|").localeCompare(right.join("|")));
  const chosen = rotations[0] ?? cycle;
  return [...chosen, chosen[0] ?? ""];
}

function canonicalPair(left: string, right: string): string {
  return left.localeCompare(right) <= 0 ? `${left}|${right}` : `${right}|${left}`;
}

function validateCyclePolicy(model: RepositoryModel): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const policies = isPlainObject(model.ontology.validationPolicies.relationship_cycles)
    ? model.ontology.validationPolicies.relationship_cycles
    : {};
  const assignments = new Map<string, string[]>();
  for (const policy of ["forbidden", "report_only", "allowed"] as const) {
    for (const predicate of asArray(policies[policy])) {
      if (typeof predicate === "string") {
        const entries = assignments.get(predicate) ?? [];
        entries.push(policy);
        assignments.set(predicate, entries);
      }
    }
  }
  const registered = new Set(
    model.ontology.relationshipTypes
      .map((item) => asString(item.key))
      .filter((item): item is string => Boolean(item)),
  );
  for (const predicate of registered) {
    const entries = assignments.get(predicate) ?? [];
    if (entries.length !== 1) {
      diagnostics.push(
        diagnostic(
          "REL_CYCLE_POLICY_COVERAGE",
          "error",
          "validation/policies.yaml",
          `Predicate '${predicate}' must have exactly one cycle policy; found ${entries.length}.`,
        ),
      );
    }
  }
  for (const predicate of assignments.keys()) {
    if (!registered.has(predicate)) {
      diagnostics.push(
        diagnostic(
          "REL_CYCLE_POLICY_UNKNOWN",
          "error",
          "validation/policies.yaml",
          `Cycle policy references unregistered predicate '${predicate}'.`,
        ),
      );
    }
  }
  return diagnostics;
}
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}
