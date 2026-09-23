import { describe, expect, it } from "vitest";
import { createSchemaValidator, validateSchemas } from "../src/schema-validator.js";
import type { GovernedFile } from "../src/model.js";
import { loadRepository } from "../src/model.js";

const schemaPath = "schemas/synthetic.schema.json";
const schemaId = "https://synthetic.invalid/record";
function file(data: unknown, schemaRef = schemaPath): GovernedFile {
  return { path: "synthetic.json", absolutePath: "unused", schemaRef, data, format: "json" };
}
const recordSchema = () => ({
  $id: schemaId,
  type: "object",
  additionalProperties: false,
  required: ["count", "id"],
  properties: { count: { type: "integer", minimum: 1 }, id: { type: "string", format: "uuid" } },
});
const input = { count: 1, id: "11111111-1111-4111-8111-111111111111" };

describe("compiled schema snapshot", () => {
  it("matches filesystem validation of registered records and preserves mapping coverage", async () => {
    const model = await loadRepository(process.cwd());
    const original = await validateSchemas(model);
    expect(original.diagnostics).toEqual([]);
    expect(createSchemaValidator(original.documents)(model)).toEqual(original);
  });

  it("detaches schemas and returned documents/diagnostics while preserving strict validation", () => {
    const schema = recordSchema();
    const docs = new Map([[schemaPath, schema]]);
    const validate = createSchemaValidator(docs);
    schema.properties.count.type = "string";
    docs.clear();
    const valid = validate({ governedFiles: [file(input)], diagnostics: [] });
    expect(valid.diagnostics).toEqual([]);
    expect(valid.validatedFiles).toEqual(["synthetic.json"]);
    valid.documents.get(schemaPath)!.required = [];
    valid.documents.get(schemaPath)!.additionalProperties = true;
    const badInput = { ...input, count: "1", extra: "do not strip" };
    const before = structuredClone(badInput);
    const rejected = validate({ governedFiles: [file(badInput)], diagnostics: [] });
    expect(rejected.validatedFiles).toEqual([]);
    expect(rejected.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SCHEMA_INSTANCE", pointer: "/count" }),
        expect.objectContaining({
          code: "SCHEMA_INSTANCE",
          message: expect.stringContaining("extra"),
        }),
      ]),
    );
    expect(badInput).toEqual(before);
    rejected.diagnostics[0]!.code = "FORGED";
    expect(
      validate({ governedFiles: [file(badInput)], diagnostics: [] }).diagnostics,
    ).not.toContainEqual(expect.objectContaining({ code: "FORGED" }));
  });

  it.each([
    { data: { ...input, count: 0 }, pointer: "/count" },
    { data: { ...input, count: 1.5 }, pointer: "/count" },
    { data: { ...input, id: "not-a-uuid" }, pointer: "/id" },
    { data: {}, pointer: "/" },
  ])("rejects boundary and missing values without defaults: $pointer", ({ data, pointer }) => {
    const validate = createSchemaValidator(new Map([[schemaPath, recordSchema()]]));
    const before = structuredClone(data);
    expect(validate({ governedFiles: [file(data)], diagnostics: [] }).diagnostics).toContainEqual(
      expect.objectContaining({ code: "SCHEMA_INSTANCE", pointer }),
    );
    expect(data).toEqual(before);
  });

  it("resolves forward references and fragment mappings after all documents are registered", () => {
    const validate = createSchemaValidator(
      new Map([
        [schemaPath, { $id: schemaId, $ref: "https://synthetic.invalid/defs#/$defs/count" }],
        [
          "schemas/defs.schema.json",
          { $id: "https://synthetic.invalid/defs", $defs: { count: { type: "integer" } } },
        ],
      ]),
    );
    expect(
      validate({
        governedFiles: [file(2), file(3, "schemas/defs.schema.json#/$defs/count")],
        diagnostics: [],
      }).diagnostics,
    ).toEqual([]);
    expect(validate({ governedFiles: [file("2")], diagnostics: [] }).diagnostics).toContainEqual(
      expect.objectContaining({ code: "SCHEMA_INSTANCE" }),
    );
  });

  it.each([
    { extra: { $id: schemaId, type: "boolean" }, code: "SCHEMA_DUPLICATE_ID" },
    { extra: { type: "object" }, code: "SCHEMA_ID_MISSING" },
    { extra: { $id: "https://synthetic.invalid/bad", type: "not-a-type" }, code: "SCHEMA_COMPILE" },
    {
      extra: { $id: "https://synthetic.invalid/bad", $ref: "https://synthetic.invalid/missing" },
      code: "SCHEMA_REFERENCE",
    },
  ])("retains compilation failure across calls: $code", ({ extra, code }) => {
    const validate = createSchemaValidator(
      new Map<string, unknown>([
        [schemaPath, recordSchema()],
        ["schemas/bad.schema.json", extra],
      ]),
    );
    const request = { governedFiles: [file(input)], diagnostics: [] };
    const first = validate(request);
    expect(first.diagnostics).toContainEqual(expect.objectContaining({ code }));
    first.diagnostics.length = 0;
    expect(validate(request).diagnostics).toContainEqual(expect.objectContaining({ code }));
  });

  it("rejects absent mappings and compiled fragments and retains loader diagnostics", () => {
    const validate = createSchemaValidator(new Map([[schemaPath, recordSchema()]]));
    const loader = {
      code: "SCHEMA_JSON_PARSE",
      severity: "error" as const,
      path: "bad.json",
      message: "Invalid JSON",
    };
    const result = validate({
      governedFiles: [file(input, "missing"), file(input, `${schemaPath}#/$defs/absent`)],
      diagnostics: [loader],
    });
    expect(result.diagnostics.filter((d) => d.code === "SCHEMA_MAPPING_UNKNOWN")).toHaveLength(2);
    expect(result.diagnostics).toContainEqual(loader);
    result.diagnostics[0]!.message = "changed";
    expect(loader.message).toBe("Invalid JSON");
  });
});
