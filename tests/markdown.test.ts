import { describe, expect, it } from "vitest";

import { validateLinks, validateMarkdown } from "../src/markdown-validator.js";
import { recordFromData, fixtureMarkdown, validSemanticModel } from "./helpers.js";

describe("Markdown contract validation", () => {
  it("accepts a complete synthetic knowledge unit", async () => {
    const result = validateMarkdown(await validSemanticModel());
    expect(result.diagnostics).toEqual([]);
    expect(result.checkedKnowledgeUnits).toBe(1);
  });

  it("rejects missing and duplicate sections, placeholders, absolutes, and missing trade-offs", async () => {
    const model = await validSemanticModel();
    const document = await fixtureMarkdown("invalid/markdown.md");
    const invalid = recordFromData(
      document.frontMatter as Record<string, unknown>,
      document.path,
      document,
    );
    model.records.push(invalid);
    model.concepts.push(invalid);
    model.markdownFiles.push(document);
    const codes = validateMarkdown(model).diagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "MARKDOWN_SECTION_MISSING",
        "MARKDOWN_HEADING_DUPLICATE",
        "MARKDOWN_PLACEHOLDER",
        "MARKDOWN_ABSOLUTE_RECOMMENDATION",
        "MARKDOWN_BENEFIT_WITHOUT_TRADEOFF",
        "MARKDOWN_FAILURE_MODES_REQUIRED",
        "MARKDOWN_THREAT_ASSUMPTIONS_REQUIRED",
      ]),
    );
  });

  it("accepts explicit not-applicable reasons but rejects an empty marker", async () => {
    const model = await validSemanticModel();
    const document = model.concepts[0]!.markdown!;
    document.sections.set("Runtime View", "Not applicable:");
    expect(validateMarkdown(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "MARKDOWN_NOT_APPLICABLE_REASON" })]),
    );
  });

  it("allows a terminal failure-mode analysis without invented peer failures", async () => {
    const model = await validSemanticModel();
    model.concepts[0]!.data.type = "failure-mode";
    model.concepts[0]!.data.failure_modes = [];
    const codes = validateMarkdown(model).diagnostics.map((item) => item.code);
    expect(codes).not.toContain("MARKDOWN_FAILURE_MODES_REQUIRED");
  });

  it("rejects empty structured context and generic related-concept boilerplate", async () => {
    const model = await validSemanticModel();
    model.concepts[0]!.data.constraints = [];
    model.concepts[0]!.markdown!.sections.set(
      "Related Concepts",
      "AKC-900002 and AKC-900004 are governed related concepts.",
    );
    const codes = validateMarkdown(model).diagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "MARKDOWN_STRUCTURED_METADATA_REQUIRED",
        "MARKDOWN_RELATED_CONCEPTS_BOILERPLATE",
      ]),
    );
  });

  it("rejects drift between structured metadata and its Markdown projection", async () => {
    const model = await validSemanticModel();
    model.concepts[0]!.markdown!.sections.set(
      "Examples",
      "A different human-readable example that no longer projects the structured statement.",
    );
    expect(validateMarkdown(model).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MARKDOWN_STRUCTURED_PROJECTION_MISMATCH" }),
      ]),
    );
  });
});

describe("Markdown link validation", () => {
  it("accepts the repository's resolvable local links", async () => {
    const model = await validSemanticModel();
    const result = await validateLinks(model);
    expect(result.diagnostics).toEqual([]);
  });

  it("rejects a missing local target", async () => {
    const model = await validSemanticModel();
    const invalid = await fixtureMarkdown("invalid/markdown.md");
    model.markdownFiles = [invalid];
    expect((await validateLinks(model)).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "LINK_UNRESOLVED" })]),
    );
  });
});
