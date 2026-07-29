import { describe, expect, it } from "vitest";

import { isPlainObject } from "../src/io.js";
import { loadRepository } from "../src/model.js";
import { validateRegistrySchemaConsistency } from "../src/registry-consistency-validator.js";
import { validateSchemas } from "../src/schema-validator.js";

async function vocabularyDiagnostics() {
  const model = await loadRepository(process.cwd());
  const schemas = await validateSchemas(model);
  return {
    model,
    schemas,
    diagnostics: validateRegistrySchemaConsistency(model, schemas.documents).diagnostics,
  };
}

describe("machine-readable registry and schema consistency", () => {
  it("accepts every declared vocabulary contract", async () => {
    expect((await vocabularyDiagnostics()).diagnostics).toEqual([]);
  });

  it("rejects registry-only assignable values", async () => {
    const { model, schemas } = await vocabularyDiagnostics();
    const added = {
      key: "audit-probe-type",
      definition: "Synthetic registry drift probe.",
      assignable_primary: true,
    };
    const data = model.governedFiles.find(
      (file) => file.path === "ontology/concept-types.yaml",
    )?.data;
    if (!isPlainObject(data) || !Array.isArray(data.types)) throw new Error("Missing registry");
    data.types.push(added);
    model.ontology.conceptTypes.push(added);
    expect(validateRegistrySchemaConsistency(model, schemas.documents).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SCHEMA_REGISTRY_DRIFT",
          path: "ontology/concept-types.yaml",
        }),
      ]),
    );
  });

  it("rejects schema-only values", async () => {
    const { model, schemas } = await vocabularyDiagnostics();
    const knowledge = schemas.documents.get("schemas/knowledge-unit.schema.json");
    const enumValues = pointer(knowledge, ["properties", "type", "enum"]);
    if (!Array.isArray(enumValues)) throw new Error("Missing schema enum");
    enumValues.push("schema-only-probe");
    expect(validateRegistrySchemaConsistency(model, schemas.documents).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SCHEMA_REGISTRY_DRIFT" })]),
    );
  });

  it("rejects invalid assignability changes", async () => {
    const { model, schemas } = await vocabularyDiagnostics();
    const type = model.ontology.conceptTypes.find((item) => item.assignable_primary === true);
    if (!type) throw new Error("Missing assignable type");
    type.assignable_primary = false;
    expect(validateRegistrySchemaConsistency(model, schemas.documents).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SCHEMA_REGISTRY_DRIFT" })]),
    );
  });

  it("detects a missing required mapping declaration", async () => {
    const { model, schemas } = await vocabularyDiagnostics();
    const mappings = model.vocabularyMappings.mappings;
    if (!Array.isArray(mappings)) throw new Error("Missing mappings");
    model.vocabularyMappings.mappings = mappings.slice(1);
    expect(validateRegistrySchemaConsistency(model, schemas.documents).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "VOCABULARY_MAPPING_MISSING" })]),
    );
  });

  it("detects stale and duplicate mapping declarations", async () => {
    const { model, schemas } = await vocabularyDiagnostics();
    const mappings = model.vocabularyMappings.mappings;
    if (!Array.isArray(mappings) || !isPlainObject(mappings[0])) throw new Error("Missing mapping");
    model.vocabularyMappings.mappings = [
      ...mappings,
      { ...mappings[0], name: "stale-probe", schema_path: "/not/a/vocabulary" },
      { ...mappings[0], name: "duplicate-pair-probe" },
    ];
    const diagnostics = validateRegistrySchemaConsistency(model, schemas.documents).diagnostics;
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "VOCABULARY_MAPPING_STALE" }),
        expect.objectContaining({ code: "VOCABULARY_MAPPING_DUPLICATE" }),
      ]),
    );
  });
});

function pointer(root: unknown, segments: string[]): unknown {
  return segments.reduce<unknown>(
    (value, key) => (isPlainObject(value) ? value[key] : undefined),
    root,
  );
}
