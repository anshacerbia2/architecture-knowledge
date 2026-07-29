import { asArray, asString, asStringArray, isPlainObject } from "./io.js";
import { diagnostic, type Diagnostic } from "./diagnostics.js";
import type { RecordEntry, RepositoryModel } from "./model.js";

const canonicalIdPattern = /^(AKC|AKS|AKL|AKR|AKG)-[0-9]{6}$/;

export interface ReferenceOccurrence {
  from: string;
  fromId: string;
  targetId: string;
  pointer: string;
}

export interface IdentityAnalysis {
  diagnostics: Diagnostic[];
  duplicateIds: { id: string; paths: string[] }[];
  duplicateKeys: { key: string; owners: string[] }[];
  unresolvedReferences: ReferenceOccurrence[];
  references: ReferenceOccurrence[];
  humanKeyLookup: { key: string; id: string; current: boolean }[];
}

export function validateIdentities(model: RepositoryModel): IdentityAnalysis {
  const diagnostics: Diagnostic[] = [];
  const duplicateIds: IdentityAnalysis["duplicateIds"] = [];
  const duplicateKeys: IdentityAnalysis["duplicateKeys"] = [];
  const unresolvedReferences: ReferenceOccurrence[] = [];
  const byId = new Map<string, RecordEntry[]>();
  const prefixByKind = new Map(
    model.ontology.recordKinds
      .map((item) => [asString(item.key), asString(item.id_namespace)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1])),
  );

  for (const record of model.records) {
    const entries = byId.get(record.id) ?? [];
    entries.push(record);
    byId.set(record.id, entries);
    if (!canonicalIdPattern.test(record.id)) {
      diagnostics.push(
        diagnostic(
          "ID_FORMAT",
          "error",
          record.path,
          `Identifier '${record.id}' is not canonical.`,
        ),
      );
    }
    const expectedPrefix = prefixByKind.get(record.recordKind);
    if (!expectedPrefix) {
      diagnostics.push(
        diagnostic(
          "ID_RECORD_KIND_UNKNOWN",
          "error",
          record.path,
          `Record kind '${record.recordKind}' has no registered identifier namespace.`,
        ),
      );
    } else if (!record.id.startsWith(`${expectedPrefix}-`)) {
      diagnostics.push(
        diagnostic(
          "ID_PREFIX",
          "error",
          record.path,
          `Identifier '${record.id}' must use prefix '${expectedPrefix}' for record kind '${record.recordKind}'.`,
        ),
      );
    }
  }

  for (const [id, entries] of byId) {
    if (entries.length > 1) {
      const paths = entries.map((entry) => entry.path).sort();
      duplicateIds.push({ id, paths });
      for (const entry of entries) {
        diagnostics.push(
          diagnostic(
            "ID_DUPLICATE",
            "error",
            entry.path,
            `Identifier '${id}' is used ${entries.length} times.`,
          ),
        );
      }
    }
  }

  const references = model.records.flatMap(extractReferences);
  for (const event of asArray(model.lifecycleEvents.events).filter(isPlainObject)) {
    const targetId = asString(event.record_id);
    const eventId = asString(event.event_id) ?? "unknown-event";
    if (targetId) {
      references.push({
        from: "governance/lifecycle-events.yaml",
        fromId: eventId,
        targetId,
        pointer: `/events/${eventId}/record_id`,
      });
    }
  }
  const existingIds = new Set(model.records.map((record) => record.id));
  for (const reference of references) {
    if (!existingIds.has(reference.targetId)) {
      unresolvedReferences.push(reference);
      diagnostics.push(
        diagnostic(
          "ID_REFERENCE_UNRESOLVED",
          "error",
          reference.from,
          `Reference '${reference.targetId}' from '${reference.fromId}' does not resolve.`,
          reference.pointer,
        ),
      );
    } else {
      const target = byId.get(reference.targetId)?.[0];
      const targetStatus = target ? asString(target.data.status) : undefined;
      if (targetStatus === "superseded") {
        diagnostics.push(
          diagnostic(
            "ID_REFERENCE_SUPERSEDED",
            "warning",
            reference.from,
            `Reference '${reference.targetId}' points to superseded content.`,
            reference.pointer,
          ),
        );
      }
    }
  }

  const aliasOwners = new Map<string, Set<string>>();
  for (const concept of model.concepts) {
    for (const alias of asStringArray(concept.data.aliases)) {
      addOwner(aliasOwners, normalizeHumanKey(alias), concept.id);
    }
  }

  const allocations = asArray(model.idLedger.allocations).filter(isPlainObject);
  const allocationById = new Map<string, Record<string, unknown>[]>();
  const humanKeyOwners = new Map<string, Set<string>>();
  const activeHumanKeyOwners = new Map<string, Set<string>>();
  const retiredHumanKeyOwners = new Map<string, Set<string>>();
  const humanKeyLookup: IdentityAnalysis["humanKeyLookup"] = [];
  for (const allocation of allocations) {
    const id = asString(allocation.id);
    if (!id) {
      continue;
    }
    const entries = allocationById.get(id) ?? [];
    entries.push(allocation);
    allocationById.set(id, entries);
    const humanKey = asString(allocation.human_key);
    const previousHumanKeys = asStringArray(allocation.previous_human_keys);
    const state = asString(allocation.state);
    for (const key of [humanKey, ...previousHumanKeys].filter((value): value is string =>
      Boolean(value),
    )) {
      addOwner(humanKeyOwners, key, id);
      addOwner(state === "retired" ? retiredHumanKeyOwners : activeHumanKeyOwners, key, id);
      humanKeyLookup.push({ key, id, current: key === humanKey });
    }
    if (humanKey && previousHumanKeys.includes(humanKey)) {
      diagnostics.push(
        diagnostic(
          "ID_HUMAN_KEY_HISTORY_INVALID",
          "error",
          "ids/ledger.yaml",
          `Allocation '${id}' repeats current human_key '${humanKey}' in previous_human_keys.`,
        ),
      );
    }
    const kind = asString(allocation.record_kind);
    const expectedPrefix = kind ? prefixByKind.get(kind) : undefined;
    if (expectedPrefix && !id.startsWith(`${expectedPrefix}-`)) {
      diagnostics.push(
        diagnostic(
          "ID_LEDGER_PREFIX",
          "error",
          "ids/ledger.yaml",
          `Allocation '${id}' does not match record kind '${kind}'.`,
        ),
      );
    }
    const record = byId.get(id)?.[0];
    if (kind === "concept" && state === "active" && !humanKey) {
      diagnostics.push(
        diagnostic(
          "ID_HUMAN_KEY_REQUIRED",
          "error",
          "ids/ledger.yaml",
          `Active concept allocation '${id}' requires a non-null human_key.`,
        ),
      );
    }
    if (state === "retired" && record) {
      diagnostics.push(
        diagnostic(
          "ID_RETIRED_REUSED",
          "error",
          record.path,
          `Retired identifier '${id}' is used by an active record.`,
        ),
      );
    }
    const allocatedPath = asString(allocation.path);
    if (state === "active" && allocatedPath && !record) {
      diagnostics.push(
        diagnostic(
          "ID_LEDGER_RECORD_MISSING",
          "error",
          "ids/ledger.yaml",
          `Active allocation '${id}' points to '${allocatedPath}', but no record exists.`,
        ),
      );
    }
    if (record && allocatedPath !== record.path) {
      diagnostics.push(
        diagnostic(
          "ID_LEDGER_PATH",
          "error",
          "ids/ledger.yaml",
          `Allocation '${id}' path '${allocatedPath ?? "null"}' does not match '${record.path}'.`,
        ),
      );
    }
  }

  for (const [id, entries] of allocationById) {
    if (entries.length > 1) {
      diagnostics.push(
        diagnostic(
          "ID_LEDGER_DUPLICATE",
          "error",
          "ids/ledger.yaml",
          `Identifier '${id}' has ${entries.length} ledger allocations.`,
        ),
      );
    }
  }
  for (const record of model.records) {
    if (!allocationById.has(record.id)) {
      diagnostics.push(
        diagnostic(
          "ID_LEDGER_UNALLOCATED",
          "error",
          record.path,
          `Identifier '${record.id}' has no immutable ledger allocation.`,
        ),
      );
    }
  }

  for (const [key, owners] of aliasOwners) {
    for (const owner of owners) addOwner(humanKeyOwners, key, owner);
  }
  for (const [key, activeOwners] of activeHumanKeyOwners) {
    const retiredOwners = retiredHumanKeyOwners.get(key) ?? new Set<string>();
    const conflicting = [...activeOwners].filter((id) => !retiredOwners.has(id));
    if (retiredOwners.size > 0 && conflicting.length > 0) {
      diagnostics.push(
        diagnostic(
          "ID_HUMAN_KEY_REUSED",
          "error",
          "ids/ledger.yaml",
          `Retired human key '${key}' is reused by ${conflicting.sort().join(", ")}.`,
        ),
      );
    }
  }
  collectDuplicateKeys(humanKeyOwners, "human key or alias", duplicateKeys, diagnostics);
  validateControlledKeys(model, duplicateKeys, diagnostics);

  return {
    diagnostics,
    duplicateIds,
    duplicateKeys,
    unresolvedReferences,
    references,
    humanKeyLookup: humanKeyLookup.sort(
      (left, right) => left.key.localeCompare(right.key) || left.id.localeCompare(right.id),
    ),
  };
}

function extractReferences(record: RecordEntry): ReferenceOccurrence[] {
  const references: ReferenceOccurrence[] = [];
  function visit(value: unknown, pointer: string, property?: string): void {
    if (typeof value === "string" && canonicalIdPattern.test(value)) {
      if (!(property === "id" && pointer === "/id") && value !== record.id) {
        references.push({
          from: record.path,
          fromId: record.id,
          targetId: value,
          pointer,
        });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${pointer}/${index}`));
    } else if (isPlainObject(value)) {
      for (const [key, item] of Object.entries(value)) {
        visit(item, `${pointer}/${escapePointer(key)}`, key);
      }
    }
  }
  visit(record.data, "");
  return references;
}

function validateControlledKeys(
  model: RepositoryModel,
  duplicateKeys: IdentityAnalysis["duplicateKeys"],
  diagnostics: Diagnostic[],
): void {
  const registries: { path: string; items: unknown[]; property?: string }[] = [
    { path: "ontology/concept-types.yaml", items: model.ontology.conceptTypes },
    { path: "ontology/claim-types.yaml", items: model.ontology.claimTypes },
    { path: "ontology/record-kinds.yaml", items: model.ontology.recordKinds },
    { path: "ontology/relationship-types.yaml", items: model.ontology.relationshipTypes },
    { path: "ontology/source-statuses.yaml", items: model.ontology.sourceStatuses },
    { path: "ontology/domains.yaml", items: model.ontology.domains },
    { path: "ontology/architecture-dimensions.yaml", items: model.ontology.dimensions },
  ];
  for (const registry of registries) {
    const owners = new Map<string, string[]>();
    registry.items.forEach((item, index) => {
      const key =
        typeof item === "string" ? item : isPlainObject(item) ? asString(item.key) : undefined;
      if (key) {
        const entries = owners.get(key) ?? [];
        entries.push(`${registry.path}#${index}`);
        owners.set(key, entries);
      }
    });
    for (const [key, entries] of owners) {
      if (entries.length > 1) {
        const ownersList = [...entries].sort();
        duplicateKeys.push({ key, owners: ownersList });
        diagnostics.push(
          diagnostic(
            "ID_CONTROLLED_KEY_DUPLICATE",
            "error",
            registry.path,
            `Controlled key '${key}' is duplicated.`,
          ),
        );
      }
    }
  }
}

function collectDuplicateKeys(
  owners: Map<string, Set<string>>,
  label: string,
  output: IdentityAnalysis["duplicateKeys"],
  diagnostics: Diagnostic[],
): void {
  for (const [key, ids] of owners) {
    if (ids.size > 1) {
      const ownerList = [...ids].sort();
      output.push({ key, owners: ownerList });
      diagnostics.push(
        diagnostic(
          "ID_HUMAN_KEY_COLLISION",
          "error",
          "ids/ledger.yaml",
          `Normalized ${label} '${key}' is shared by ${ownerList.join(", ")}.`,
        ),
      );
    }
  }
}

function addOwner(map: Map<string, Set<string>>, key: string, owner: string): void {
  const owners = map.get(key) ?? new Set<string>();
  owners.add(owner);
  map.set(key, owners);
}

function normalizeHumanKey(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapePointer(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}
