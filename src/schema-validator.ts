import { readFile } from "node:fs/promises";
import path from "node:path";
import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormatsModule, { type FormatsPlugin } from "ajv-formats";

import { diagnostic, type Diagnostic } from "./diagnostics.js";
import { isPlainObject, relativePath, walkFiles } from "./io.js";
import type { GovernedFile, RepositoryModel } from "./model.js";

export interface SchemaValidationResult {
  diagnostics: Diagnostic[];
  validatedFiles: string[];
  schemas: string[];
}

interface LoadedSchema {
  path: string;
  id: string;
  data: Record<string, unknown>;
}

export async function validateSchemas(model: RepositoryModel): Promise<SchemaValidationResult> {
  const diagnostics = [...model.diagnostics];
  const loaded = await loadSchemas(model.root, diagnostics);
  const ajv = createAjv();

  for (const schema of loaded) {
    if (ajv.getSchema(schema.id)) {
      diagnostics.push(
        diagnostic(
          "SCHEMA_DUPLICATE_ID",
          "error",
          schema.path,
          `Schema identifier '${schema.id}' is registered more than once.`,
        ),
      );
      continue;
    }
    try {
      ajv.addSchema(schema.data, schema.id);
    } catch (error) {
      diagnostics.push(
        diagnostic(
          "SCHEMA_COMPILE",
          "error",
          schema.path,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  for (const schema of loaded) {
    try {
      const valid = ajv.validateSchema(schema.data);
      if (!valid) {
        diagnostics.push(
          ...ajvErrors("SCHEMA_METASCHEMA", schema.path, ajv.errors ?? [], "schema"),
        );
      }
      ajv.getSchema(schema.id);
    } catch (error) {
      diagnostics.push(
        diagnostic(
          "SCHEMA_REFERENCE",
          "error",
          schema.path,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  const validatedFiles: string[] = [];
  for (const file of model.governedFiles) {
    const schemaId = resolveSchemaReference(file.schemaRef, loaded);
    if (!schemaId) {
      diagnostics.push(
        diagnostic(
          "SCHEMA_MAPPING_UNKNOWN",
          "error",
          file.path,
          `Registered schema '${file.schemaRef}' does not resolve.`,
        ),
      );
      continue;
    }
    let validator: ValidateFunction | undefined;
    try {
      validator = ajv.getSchema(schemaId);
    } catch (error) {
      diagnostics.push(
        diagnostic(
          "SCHEMA_REFERENCE",
          "error",
          file.path,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
    if (!validator) {
      diagnostics.push(
        diagnostic(
          "SCHEMA_MAPPING_UNKNOWN",
          "error",
          file.path,
          `Compiled validator '${schemaId}' is unavailable.`,
        ),
      );
      continue;
    }
    if (!validator(file.data)) {
      diagnostics.push(
        ...ajvErrors("SCHEMA_INSTANCE", file.path, validator.errors ?? [], "record"),
      );
    } else {
      validatedFiles.push(file.path);
    }
  }

  return {
    diagnostics,
    validatedFiles: validatedFiles.sort(),
    schemas: loaded.map((schema) => schema.path).sort(),
  };
}

function createAjv(): Ajv2020 {
  const ajv = new Ajv2020({
    allErrors: true,
    allowUnionTypes: true,
    coerceTypes: false,
    strict: true,
    validateFormats: true,
  });
  const addFormats =
    (addFormatsModule as unknown as { default?: FormatsPlugin }).default ??
    (addFormatsModule as unknown as FormatsPlugin);
  addFormats(ajv);
  return ajv;
}

async function loadSchemas(root: string, diagnostics: Diagnostic[]): Promise<LoadedSchema[]> {
  const files = (await walkFiles(path.join(root, "schemas"))).filter((file) =>
    file.endsWith(".schema.json"),
  );
  const loaded: LoadedSchema[] = [];
  for (const absolutePath of files) {
    const displayPath = relativePath(root, absolutePath);
    try {
      const data = JSON.parse(await readFile(absolutePath, "utf8")) as unknown;
      if (!isPlainObject(data) || typeof data.$id !== "string") {
        diagnostics.push(
          diagnostic(
            "SCHEMA_ID_MISSING",
            "error",
            displayPath,
            "JSON Schema must contain a string $id.",
          ),
        );
        continue;
      }
      loaded.push({ path: displayPath, id: data.$id, data });
    } catch (error) {
      diagnostics.push(
        diagnostic(
          "SCHEMA_JSON_PARSE",
          "error",
          displayPath,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
  return loaded;
}

function resolveSchemaReference(
  reference: string,
  schemas: readonly LoadedSchema[],
): string | undefined {
  const [schemaPath, fragment] = reference.split("#", 2);
  const schema = schemas.find((candidate) => candidate.path === schemaPath);
  return schema ? `${schema.id}${fragment === undefined ? "" : `#${fragment}`}` : undefined;
}

function ajvErrors(
  code: string,
  filePath: string,
  errors: readonly ErrorObject[],
  noun: string,
): Diagnostic[] {
  return errors.map((error) => {
    const pointer = error.instancePath || "/";
    const details =
      error.keyword === "additionalProperties" &&
      isPlainObject(error.params) &&
      typeof error.params.additionalProperty === "string"
        ? ` Unknown property '${error.params.additionalProperty}'.`
        : "";
    return diagnostic(
      code,
      "error",
      filePath,
      `Invalid ${noun}: ${error.message ?? error.keyword}.${details}`,
      pointer,
    );
  });
}

export function schemaCoverage(
  model: RepositoryModel,
  result: SchemaValidationResult,
): {
  governed_files: number;
  validated_files: number;
  schema_files: number;
  mapped_files: { path: string; schema: string }[];
} {
  return {
    governed_files: model.governedFiles.length,
    validated_files: result.validatedFiles.length,
    schema_files: result.schemas.length,
    mapped_files: model.governedFiles
      .map((file: GovernedFile) => ({ path: file.path, schema: file.schemaRef }))
      .sort((left, right) => left.path.localeCompare(right.path)),
  };
}
