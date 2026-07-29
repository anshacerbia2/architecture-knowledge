import { diagnostic, type Diagnostic } from "./diagnostics.js";
import { asArray, asString, isPlainObject } from "./io.js";
import type { RepositoryModel } from "./model.js";

export type SchemaDocuments = ReadonlyMap<string, Record<string, unknown>>;

export interface VocabularyAnalysis {
  diagnostics: Diagnostic[];
  checkedMappings: string[];
}

export function validateRegistrySchemaConsistency(
  model: RepositoryModel,
  schemas: SchemaDocuments,
): VocabularyAnalysis {
  const diagnostics: Diagnostic[] = [];
  const coverage = asArray(model.vocabularyMappings.coverage).filter(isPlainObject);
  const mappings = asArray(model.vocabularyMappings.mappings).filter(isPlainObject);
  const coverageKeys = new Set<string>();
  const mappedPairs = new Map<string, number>();
  const names = new Set<string>();
  const checkedMappings: string[] = [];

  for (const pair of coverage) {
    const key = pairKey(pair);
    if (!key) continue;
    if (coverageKeys.has(key)) {
      diagnostics.push(
        diagnostic(
          "VOCABULARY_COVERAGE_DUPLICATE",
          "error",
          "validation/vocabulary-mappings.yaml",
          `Schema vocabulary coverage '${key}' is declared more than once.`,
        ),
      );
    }
    coverageKeys.add(key);
  }

  for (const mapping of mappings) {
    const name = asString(mapping.name) ?? "unnamed";
    const key = pairKey(mapping);
    if (names.has(name)) {
      diagnostics.push(
        diagnostic(
          "VOCABULARY_MAPPING_DUPLICATE",
          "error",
          "validation/vocabulary-mappings.yaml",
          `Vocabulary mapping name '${name}' is duplicated.`,
        ),
      );
    }
    names.add(name);
    if (key) mappedPairs.set(key, (mappedPairs.get(key) ?? 0) + 1);
  }

  for (const key of [...coverageKeys].sort()) {
    const count = mappedPairs.get(key) ?? 0;
    if (count === 0) {
      diagnostics.push(
        diagnostic(
          "VOCABULARY_MAPPING_MISSING",
          "error",
          "validation/vocabulary-mappings.yaml",
          `Required registry/schema vocabulary pair '${key}' has no mapping.`,
        ),
      );
    } else if (count > 1) {
      diagnostics.push(
        diagnostic(
          "VOCABULARY_MAPPING_DUPLICATE",
          "error",
          "validation/vocabulary-mappings.yaml",
          `Schema vocabulary pair '${key}' has ${count} mappings.`,
        ),
      );
    }
  }

  for (const mapping of mappings) {
    const name = asString(mapping.name) ?? "unnamed";
    const key = pairKey(mapping);
    if (!key || !coverageKeys.has(key)) {
      diagnostics.push(
        diagnostic(
          "VOCABULARY_MAPPING_STALE",
          "error",
          "validation/vocabulary-mappings.yaml",
          `Vocabulary mapping '${name}' does not match a declared schema vocabulary path.`,
        ),
      );
      continue;
    }
    const registryPath = asString(mapping.registry);
    const registryPointer = asString(mapping.registry_path);
    const schemaPath = asString(mapping.schema);
    const schemaPointer = asString(mapping.schema_path);
    if (!registryPath || !registryPointer || !schemaPath || !schemaPointer) continue;
    const registry = model.governedFiles.find((file) => file.path === registryPath)?.data;
    const schema = schemas.get(schemaPath);
    if (registry === undefined) {
      diagnostics.push(
        diagnostic(
          "VOCABULARY_REGISTRY_UNRESOLVED",
          "error",
          "validation/vocabulary-mappings.yaml",
          `Mapping '${name}' references unavailable registry '${registryPath}'.`,
        ),
      );
      continue;
    }
    if (!schema) {
      diagnostics.push(
        diagnostic(
          "VOCABULARY_SCHEMA_UNRESOLVED",
          "error",
          "validation/vocabulary-mappings.yaml",
          `Mapping '${name}' references unavailable schema '${schemaPath}'.`,
        ),
      );
      continue;
    }
    const registryValue = atPointer(registry, registryPointer);
    const schemaValue = atPointer(schema, schemaPointer);
    if (!Array.isArray(registryValue) || !Array.isArray(schemaValue)) {
      diagnostics.push(
        diagnostic(
          "VOCABULARY_PATH_UNRESOLVED",
          "error",
          "validation/vocabulary-mappings.yaml",
          `Mapping '${name}' must resolve both pointers to arrays.`,
        ),
      );
      continue;
    }
    const registryValues = selectedValues(registryValue, mapping, name, diagnostics);
    const schemaValues = schemaValue.filter((value): value is string => typeof value === "string");
    compare(name, registryPath, schemaPath, registryValues, schemaValues, diagnostics);
    checkedMappings.push(name);
  }

  return { diagnostics, checkedMappings: checkedMappings.sort() };
}

function selectedValues(
  values: unknown[],
  mapping: Record<string, unknown>,
  name: string,
  diagnostics: Diagnostic[],
): string[] {
  const mode = asString(mapping.comparison_mode);
  if (mode === "string-values") {
    return values.filter((value): value is string => typeof value === "string");
  }
  const rules = isPlainObject(mapping.assignability_rules) ? mapping.assignability_rules : {};
  const keyField = asString(rules.key_field) ?? "key";
  const filterField = asString(rules.filter_field);
  const filterEquals = rules.filter_equals;
  const hasDefault = Object.hasOwn(rules, "default_value");
  const selected = values.filter(isPlainObject).filter((item) => {
    if (!filterField) return true;
    const actual = Object.hasOwn(item, filterField)
      ? item[filterField]
      : hasDefault
        ? rules.default_value
        : undefined;
    return actual === filterEquals;
  });
  const output: string[] = [];
  const owners = new Map<string, number>();
  for (const item of selected) {
    const key = asString(item[keyField]);
    if (!key) continue;
    owners.set(key, (owners.get(key) ?? 0) + 1);
    output.push(key);
  }
  for (const [key, count] of owners) {
    if (count > 1) {
      diagnostics.push(
        diagnostic(
          "VOCABULARY_REGISTRY_KEY_DUPLICATE",
          "error",
          asString(mapping.registry) ?? "validation/vocabulary-mappings.yaml",
          `Mapping '${name}' selects duplicate controlled key '${key}'.`,
        ),
      );
    }
  }
  return output;
}

function compare(
  name: string,
  registryPath: string,
  schemaPath: string,
  registryValues: string[],
  schemaValues: string[],
  diagnostics: Diagnostic[],
): void {
  const registry = normalized(registryValues);
  const schema = normalized(schemaValues);
  const registryOnly = registry.filter((value) => !schema.includes(value));
  const schemaOnly = schema.filter((value) => !registry.includes(value));
  if (registryOnly.length === 0 && schemaOnly.length === 0) return;
  diagnostics.push(
    diagnostic(
      "SCHEMA_REGISTRY_DRIFT",
      "error",
      registryPath,
      `Mapping '${name}' differs from '${schemaPath}'; registry-only: ${format(
        registryOnly,
      )}; schema-only: ${format(schemaOnly)}.`,
    ),
  );
}

function pairKey(pair: Record<string, unknown>): string | undefined {
  const schema = asString(pair.schema);
  const pointer = asString(pair.schema_path);
  return schema && pointer ? `${schema}#${pointer}` : undefined;
}

function atPointer(root: unknown, pointer: string): unknown {
  return pointer
    .split("/")
    .slice(1)
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<unknown>((value, segment) => {
      if (Array.isArray(value)) {
        const index = Number(segment);
        return Number.isInteger(index) ? value[index] : undefined;
      }
      return isPlainObject(value) ? value[segment] : undefined;
    }, root);
}

function normalized(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function format(values: readonly string[]): string {
  return values.length === 0 ? "none" : values.join(", ");
}
