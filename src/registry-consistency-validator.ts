import { diagnostic, type Diagnostic } from "./diagnostics.js";
import { asArray, asString, isPlainObject } from "./io.js";
import type { RepositoryModel } from "./model.js";

type SchemaDocuments = ReadonlyMap<string, Record<string, unknown>>;

interface VocabularyContract {
  label: string;
  registryPath: string;
  schemaPath: string;
  registryValues: string[];
  schemaValues: string[];
}

export function validateRegistrySchemaConsistency(
  model: RepositoryModel,
  schemas: SchemaDocuments,
): Diagnostic[] {
  const knowledge = schemas.get("schemas/knowledge-unit.schema.json");
  const definitions = schemas.get("schemas/_defs.schema.json");
  const claim = schemas.get("schemas/claim.schema.json");
  const relationship = schemas.get("schemas/relationship.schema.json");
  const source = schemas.get("schemas/source.schema.json");

  const contracts: VocabularyContract[] = [
    {
      label: "assignable concept types",
      registryPath: "ontology/concept-types.yaml",
      schemaPath: "schemas/knowledge-unit.schema.json",
      registryValues: keys(
        model.ontology.conceptTypes.filter((item) => item.assignable_primary === true),
      ),
      schemaValues: enumAt(knowledge, ["properties", "type", "enum"]),
    },
    {
      label: "domains",
      registryPath: "ontology/domains.yaml",
      schemaPath: "schemas/knowledge-unit.schema.json",
      registryValues: model.ontology.domains,
      schemaValues: enumAt(knowledge, ["$defs", "domain", "enum"]),
    },
    {
      label: "architecture dimensions",
      registryPath: "ontology/architecture-dimensions.yaml",
      schemaPath: "schemas/knowledge-unit.schema.json",
      registryValues: model.ontology.dimensions,
      schemaValues: enumAt(knowledge, ["properties", "dimensions", "items", "enum"]),
    },
    {
      label: "lifecycle statuses",
      registryPath: "ontology/lifecycle-statuses.yaml",
      schemaPath: "schemas/_defs.schema.json",
      registryValues: asArray(model.ontology.lifecycle.statuses).filter(
        (item): item is string => typeof item === "string",
      ),
      schemaValues: enumAt(definitions, ["$defs", "lifecycleStatus", "enum"]),
    },
    {
      label: "maturity levels",
      registryPath: "ontology/maturity-levels.yaml",
      schemaPath: "schemas/_defs.schema.json",
      registryValues: keys(model.ontology.maturityLevels),
      schemaValues: enumAt(definitions, ["$defs", "maturity", "enum"]),
    },
    {
      label: "claim types",
      registryPath: "ontology/claim-types.yaml",
      schemaPath: "schemas/claim.schema.json",
      registryValues: keys(model.ontology.claimTypes),
      schemaValues: enumAt(claim, ["properties", "claim_type", "enum"]),
    },
    {
      label: "claim types requiring evidence",
      registryPath: "ontology/claim-types.yaml",
      schemaPath: "schemas/claim.schema.json",
      registryValues: keys(
        model.ontology.claimTypes.filter((item) => item.evidence_required === true),
      ),
      schemaValues: enumAt(claim, ["allOf", "0", "if", "properties", "claim_type", "enum"]),
    },
    {
      label: "claim types requiring conditions",
      registryPath: "ontology/claim-types.yaml",
      schemaPath: "schemas/claim.schema.json",
      registryValues: keys(
        model.ontology.claimTypes.filter((item) => item.conditions_required === true),
      ),
      schemaValues: enumAt(claim, ["allOf", "1", "if", "properties", "claim_type", "enum"]),
    },
    {
      label: "relationship predicates",
      registryPath: "ontology/relationship-types.yaml",
      schemaPath: "schemas/relationship.schema.json",
      registryValues: keys(model.ontology.relationshipTypes),
      schemaValues: enumAt(relationship, ["properties", "predicate", "enum"]),
    },
    {
      label: "symmetric relationship predicates",
      registryPath: "ontology/relationship-types.yaml",
      schemaPath: "schemas/relationship.schema.json",
      registryValues: keys(
        model.ontology.relationshipTypes.filter((item) => item.direction === "symmetric"),
      ),
      schemaValues: enumAt(relationship, ["allOf", "0", "if", "properties", "predicate", "enum"]),
    },
    {
      label: "relationship predicates requiring conditions",
      registryPath: "ontology/relationship-types.yaml",
      schemaPath: "schemas/relationship.schema.json",
      registryValues: keys(
        model.ontology.relationshipTypes.filter(
          (item) =>
            (item.conditions_required ??
              model.ontology.relationshipDefaults.conditions_required) === true,
        ),
      ),
      schemaValues: enumAt(relationship, ["allOf", "1", "if", "properties", "predicate", "enum"]),
    },
    {
      label: "relationship predicates exempt from claim evidence",
      registryPath: "ontology/relationship-types.yaml",
      schemaPath: "schemas/relationship.schema.json",
      registryValues: keys(
        model.ontology.relationshipTypes.filter(
          (item) =>
            (item.evidence_claims_required ??
              model.ontology.relationshipDefaults.evidence_claims_required) === false,
        ),
      ),
      schemaValues: enumAt(relationship, ["allOf", "2", "if", "properties", "predicate", "enum"]),
    },
    {
      label: "source statuses",
      registryPath: "ontology/source-statuses.yaml",
      schemaPath: "schemas/source.schema.json",
      registryValues: keys(model.ontology.sourceStatuses),
      schemaValues: enumAt(source, ["properties", "status", "enum"]),
    },
  ];

  return contracts.flatMap(compareContract);
}

function compareContract(contract: VocabularyContract): Diagnostic[] {
  const registry = normalized(contract.registryValues);
  const schema = normalized(contract.schemaValues);
  const onlyRegistry = registry.filter((item) => !schema.includes(item));
  const onlySchema = schema.filter((item) => !registry.includes(item));
  if (onlyRegistry.length === 0 && onlySchema.length === 0) {
    return [];
  }
  return [
    diagnostic(
      "SCHEMA_REGISTRY_DRIFT",
      "error",
      contract.registryPath,
      `${contract.label} differ from '${contract.schemaPath}'; registry-only: ${formatValues(
        onlyRegistry,
      )}; schema-only: ${formatValues(onlySchema)}.`,
    ),
  ];
}

function keys(items: readonly Record<string, unknown>[]): string[] {
  return items.map((item) => asString(item.key)).filter((item): item is string => Boolean(item));
}

function enumAt(root: Record<string, unknown> | undefined, segments: readonly string[]): string[] {
  let value: unknown = root;
  for (const segment of segments) {
    if (Array.isArray(value)) {
      const index = Number(segment);
      value = Number.isInteger(index) ? value[index] : undefined;
    } else if (isPlainObject(value)) {
      value = value[segment];
    } else {
      return [];
    }
  }
  return asArray(value).filter((item): item is string => typeof item === "string");
}

function normalized(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function formatValues(values: readonly string[]): string {
  return values.length === 0 ? "none" : values.join(", ");
}
