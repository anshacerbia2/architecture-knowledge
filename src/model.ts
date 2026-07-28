import path from "node:path";

import { diagnostic, type Diagnostic } from "./diagnostics.js";
import {
  asArray,
  asString,
  isPlainObject,
  parseJsonFile,
  parseMarkdownFile,
  parseYamlFile,
  relativePath,
  walkFiles,
  type MarkdownDocument,
} from "./io.js";

export interface SchemaMapping {
  path: string;
  schema: string;
  format: "json" | "yaml";
}

export interface RecordPattern {
  prefix: string;
  extension: string;
  exclude_names: string[];
  schema: string;
  front_matter?: boolean;
}

export interface SchemaRegistry {
  schema_version: number;
  status: string;
  mappings: SchemaMapping[];
  record_patterns: RecordPattern[];
}

export interface GovernedFile {
  path: string;
  absolutePath: string;
  schemaRef: string;
  data: unknown;
  format: "json" | "yaml" | "markdown";
  markdown?: MarkdownDocument;
}

export interface RecordEntry {
  id: string;
  recordKind: string;
  path: string;
  data: Record<string, unknown>;
  markdown?: MarkdownDocument;
}

export interface RepositoryModel {
  root: string;
  files: string[];
  governedFiles: GovernedFile[];
  markdownFiles: MarkdownDocument[];
  records: RecordEntry[];
  sources: RecordEntry[];
  concepts: RecordEntry[];
  claims: RecordEntry[];
  relationships: RecordEntry[];
  decisionGuides: RecordEntry[];
  idLedger: Record<string, unknown>;
  lifecycleEvents: Record<string, unknown>;
  ontology: {
    conceptTypes: Record<string, unknown>[];
    claimTypes: Record<string, unknown>[];
    recordKinds: Record<string, unknown>[];
    relationshipTypes: Record<string, unknown>[];
    relationshipDefaults: Record<string, unknown>;
    lifecycle: Record<string, unknown>;
    sourceStatuses: Record<string, unknown>[];
    domains: string[];
    dimensions: string[];
    validationPolicies: Record<string, unknown>;
  };
  diagnostics: Diagnostic[];
}

const governedDataDirectories = [
  "claims/",
  "decisions/",
  "governance/",
  "ids/",
  "ontology/",
  "quality-scenarios/",
  "relationships/",
  "roadmap/",
  "sources/",
  "validation/",
  "generated/integrity/",
];

export async function loadRepository(root: string): Promise<RepositoryModel> {
  const absoluteRoot = path.resolve(root);
  const absoluteFiles = await walkFiles(absoluteRoot);
  const files = absoluteFiles.map((file) => relativePath(absoluteRoot, file));
  const diagnostics: Diagnostic[] = [];
  const registryPath = path.join(absoluteRoot, "schemas", "registry.json");
  const parsedRegistry = await parseJsonFile(registryPath, "schemas/registry.json");
  diagnostics.push(...parsedRegistry.diagnostics);
  if (!isPlainObject(parsedRegistry.data)) {
    throw new Error("schemas/registry.json could not be loaded.");
  }
  const schemaRegistry = parsedRegistry.data as unknown as SchemaRegistry;
  const governedFiles: GovernedFile[] = [];
  const mappedPaths = new Set<string>();

  for (const mapping of schemaRegistry.mappings) {
    const absolutePath = path.join(absoluteRoot, mapping.path);
    const parsed =
      mapping.format === "yaml"
        ? await parseYamlFile(absolutePath, mapping.path)
        : await parseJsonFile(absolutePath, mapping.path);
    diagnostics.push(...parsed.diagnostics);
    governedFiles.push({
      path: mapping.path,
      absolutePath,
      schemaRef: mapping.schema,
      data: parsed.data,
      format: mapping.format,
    });
    mappedPaths.add(mapping.path);
  }

  const markdownFiles: MarkdownDocument[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const absolutePath = absoluteFiles[index];
    if (!file || !absolutePath || file.startsWith("tests/fixtures/")) {
      continue;
    }
    const pattern = schemaRegistry.record_patterns.find((candidate) =>
      matchesPattern(file, candidate),
    );
    if (pattern && !mappedPaths.has(file)) {
      if (pattern.front_matter) {
        const parsed = await parseMarkdownFile(absolutePath, file);
        diagnostics.push(...parsed.diagnostics);
        if (parsed.document) {
          markdownFiles.push(parsed.document);
          governedFiles.push({
            path: file,
            absolutePath,
            schemaRef: pattern.schema,
            data: parsed.document.frontMatter,
            format: "markdown",
            markdown: parsed.document,
          });
        }
      } else {
        const parsed =
          pattern.extension === ".json"
            ? await parseJsonFile(absolutePath, file)
            : await parseYamlFile(absolutePath, file);
        diagnostics.push(...parsed.diagnostics);
        governedFiles.push({
          path: file,
          absolutePath,
          schemaRef: pattern.schema,
          data: parsed.data,
          format: pattern.extension === ".json" ? "json" : "yaml",
        });
      }
      mappedPaths.add(file);
    } else if (file.endsWith(".md")) {
      const parsed = await parseMarkdownFile(absolutePath, file);
      diagnostics.push(...parsed.diagnostics);
      if (parsed.document) {
        markdownFiles.push(parsed.document);
      }
    }
  }

  for (const file of files) {
    if (
      (file.endsWith(".yaml") || file.endsWith(".yml")) &&
      governedDataDirectories.some((prefix) => file.startsWith(prefix)) &&
      !file.startsWith("tests/fixtures/") &&
      !mappedPaths.has(file)
    ) {
      diagnostics.push(
        diagnostic(
          "SCHEMA_UNREGISTERED_RECORD",
          "error",
          file,
          "Governed YAML record has no registered schema mapping.",
        ),
      );
    }
  }

  const records: RecordEntry[] = [];
  for (const file of governedFiles) {
    if (!isPlainObject(file.data)) {
      continue;
    }
    if (file.path === "sources/registry.yaml") {
      for (const [index, item] of asArray(file.data.sources).entries()) {
        addRecord(records, item, `${file.path}#/sources/${index}`);
      }
    } else {
      addRecord(records, file.data, file.path, file.markdown);
    }
  }

  const byKind = (kind: string): RecordEntry[] =>
    records.filter((record) => record.recordKind === kind);
  return {
    root: absoluteRoot,
    files,
    governedFiles,
    markdownFiles,
    records,
    sources: byKind("source"),
    concepts: byKind("concept"),
    claims: byKind("claim"),
    relationships: byKind("relationship"),
    decisionGuides: byKind("decision-guide"),
    idLedger: objectFromFile(governedFiles, "ids/ledger.yaml"),
    lifecycleEvents: objectFromFile(governedFiles, "governance/lifecycle-events.yaml"),
    ontology: {
      conceptTypes: objectArray(governedFiles, "ontology/concept-types.yaml", "types"),
      claimTypes: objectArray(governedFiles, "ontology/claim-types.yaml", "types"),
      recordKinds: objectArray(governedFiles, "ontology/record-kinds.yaml", "record_kinds"),
      relationshipTypes: objectArray(
        governedFiles,
        "ontology/relationship-types.yaml",
        "predicates",
      ),
      relationshipDefaults: nestedObject(
        governedFiles,
        "ontology/relationship-types.yaml",
        "defaults",
      ),
      lifecycle: objectFromFile(governedFiles, "ontology/lifecycle-statuses.yaml"),
      sourceStatuses: objectArray(governedFiles, "ontology/source-statuses.yaml", "statuses"),
      domains: stringArray(governedFiles, "ontology/domains.yaml", "domains"),
      dimensions: objectArray(governedFiles, "ontology/architecture-dimensions.yaml", "dimensions")
        .map((item) => asString(item.key))
        .filter((item): item is string => item !== undefined),
      validationPolicies: objectFromFile(governedFiles, "validation/policies.yaml"),
    },
    diagnostics,
  };
}

function matchesPattern(file: string, pattern: RecordPattern): boolean {
  const name = path.posix.basename(file);
  return (
    file.startsWith(pattern.prefix) &&
    file.endsWith(pattern.extension) &&
    !pattern.exclude_names.includes(name)
  );
}

function addRecord(
  records: RecordEntry[],
  value: unknown,
  recordPath: string,
  markdown?: MarkdownDocument,
): void {
  if (!isPlainObject(value)) {
    return;
  }
  const id = asString(value.id);
  const recordKind = asString(value.record_kind);
  if (id && recordKind) {
    const base = { id, recordKind, path: recordPath, data: value };
    records.push(markdown ? { ...base, markdown } : base);
  }
}

function objectFromFile(files: GovernedFile[], filePath: string): Record<string, unknown> {
  const value = files.find((file) => file.path === filePath)?.data;
  return isPlainObject(value) ? value : {};
}

function nestedObject(
  files: GovernedFile[],
  filePath: string,
  property: string,
): Record<string, unknown> {
  const parent = objectFromFile(files, filePath);
  return isPlainObject(parent[property]) ? parent[property] : {};
}

function objectArray(
  files: GovernedFile[],
  filePath: string,
  property: string,
): Record<string, unknown>[] {
  return asArray(objectFromFile(files, filePath)[property]).filter(isPlainObject);
}

function stringArray(files: GovernedFile[], filePath: string, property: string): string[] {
  return asArray(objectFromFile(files, filePath)[property]).filter(
    (item): item is string => typeof item === "string",
  );
}
