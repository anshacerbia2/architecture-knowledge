import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseMarkdownFile, parseYaml, parseYamlFile } from "../src/io.js";
import { validateSchemas } from "../src/schema-validator.js";
import { loadRepository } from "../src/model.js";

describe("schema validation", () => {
  it("accepts valid source, claim, relationship, and Markdown fixtures", async () => {
    const model = await loadRepository(process.cwd());
    const files = [
      ["valid/source.yaml", "schemas/source.schema.json"],
      ["valid/claim.yaml", "schemas/claim.schema.json"],
      ["valid/relationship.yaml", "schemas/relationship.schema.json"],
    ] as const;
    for (const [relative, schemaRef] of files) {
      const fixturePath = `tests/fixtures/${relative}`;
      const parsed = await parseYamlFile(path.join(process.cwd(), fixturePath), fixturePath);
      model.governedFiles.push({
        path: fixturePath,
        absolutePath: path.join(process.cwd(), fixturePath),
        schemaRef,
        data: parsed.data,
        format: "yaml",
      });
    }
    const markdownPath = "tests/fixtures/valid/knowledge.md";
    const parsedMarkdown = await parseMarkdownFile(
      path.join(process.cwd(), markdownPath),
      markdownPath,
    );
    model.governedFiles.push({
      path: markdownPath,
      absolutePath: path.join(process.cwd(), markdownPath),
      schemaRef: "schemas/knowledge-unit.schema.json",
      data: parsedMarkdown.document?.frontMatter,
      format: "markdown",
      ...(parsedMarkdown.document ? { markdown: parsedMarkdown.document } : {}),
    });
    const result = await validateSchemas(model);
    expect(result.diagnostics.filter((item) => item.severity === "error")).toEqual([]);
  });

  it("rejects unknown properties with a precise path", async () => {
    const model = await loadRepository(process.cwd());
    const fixturePath = "tests/fixtures/invalid/schema-extra-property.yaml";
    const parsed = await parseYamlFile(path.join(process.cwd(), fixturePath), fixturePath);
    model.governedFiles.push({
      path: fixturePath,
      absolutePath: path.join(process.cwd(), fixturePath),
      schemaRef: "schemas/claim.schema.json",
      data: parsed.data,
      format: "yaml",
    });
    const result = await validateSchemas(model);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SCHEMA_INSTANCE",
          path: fixturePath,
          message: expect.stringContaining("unknown_property"),
        }),
      ]),
    );
  });

  it("rejects unknown properties in the RAG case-contract registry", async () => {
    const model = await loadRepository(process.cwd());
    const governed = model.governedFiles.find(
      (file) => file.path === "evaluation/rag-case-contracts.yaml",
    )!;
    const data = structuredClone(governed.data) as {
      contracts: Array<Record<string, unknown>>;
    };
    data.contracts[0]!.unknown_property = true;
    const fixturePath = "tests/fixtures/synthetic/rag-contract-extra-property.yaml";
    model.governedFiles.push({
      path: fixturePath,
      absolutePath: path.join(process.cwd(), fixturePath),
      schemaRef: "schemas/rag-evaluation.schema.json#/$defs/caseContractRegistry",
      data,
      format: "yaml",
    });
    const result = await validateSchemas(model);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SCHEMA_INSTANCE",
          path: fixturePath,
          message: expect.stringContaining("unknown_property"),
        }),
      ]),
    );
  });

  it("rejects duplicate YAML keys without coercion", () => {
    const parsed = parseYaml("status: proposed\nstatus: reviewed\n", "duplicate.yaml");
    expect(parsed.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SCHEMA_YAML_PARSE" })]),
    );
  });

  it("rejects normative claims without direct source and locator arrays", async () => {
    const model = await loadRepository(process.cwd());
    const data = structuredClone(model.claims.find((claim) => claim.id === "AKL-000050")!.data);
    data.id = "AKL-999991";
    data.sources = [];
    data.source_locations = [];
    model.governedFiles.push({
      path: "tests/fixtures/synthetic/normative-without-direct-source.yaml",
      absolutePath: path.join(
        process.cwd(),
        "tests/fixtures/synthetic/normative-without-direct-source.yaml",
      ),
      schemaRef: "schemas/claim.schema.json",
      data,
      format: "yaml",
    });
    const result = await validateSchemas(model);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SCHEMA_INSTANCE",
          path: "tests/fixtures/synthetic/normative-without-direct-source.yaml",
        }),
      ]),
    );
  });

  it("rejects protocol normative metadata on a repository recommendation", async () => {
    const model = await loadRepository(process.cwd());
    const data = structuredClone(model.claims.find((claim) => claim.id === "AKL-000062")!.data);
    data.id = "AKL-999992";
    data.normative = {
      force: "must-not",
      applies_to: "Synthetic clients.",
      exceptions: [],
    };
    model.governedFiles.push({
      path: "tests/fixtures/synthetic/normative-recommendation.yaml",
      absolutePath: path.join(
        process.cwd(),
        "tests/fixtures/synthetic/normative-recommendation.yaml",
      ),
      schemaRef: "schemas/claim.schema.json",
      data,
      format: "yaml",
    });
    const result = await validateSchemas(model);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SCHEMA_INSTANCE",
          path: "tests/fixtures/synthetic/normative-recommendation.yaml",
        }),
      ]),
    );
  });
});
