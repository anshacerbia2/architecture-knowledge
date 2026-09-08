import { describe, expect, it } from "vitest";
import { validateDecisionGuides } from "../src/decision-guide-validator.js";
import { guideModel } from "./decision-guide-helpers.js";

describe("M7.1-AUD-003 matrix comparability", () => {
  it("rejects the audited quantitative string and mismatched currency", async () => {
    const model = await guideModel();
    const guide = model.decisionGuides[0]!.data;
    const criterion = (guide.evaluation_criteria as Record<string, unknown>[])[0]!;
    criterion.scale = "quantitative";
    criterion.unit = "milliseconds";
    const cell = (guide.tradeoff_matrix as Record<string, unknown>[])[0]!;
    cell.assessment = {
      rating: "mixed",
      rationale: "Synthetic",
      value: "fast",
      unit: "USD",
      uncertainty: "high",
    };
    expect(validateDecisionGuides(model).diagnostics.map((d) => d.code)).toContain(
      "DG_MEASUREMENT_INCOMPATIBLE",
    );
  });
  it.each([
    ["quantitative", "ms", 1, "ms", "mixed", "high", true],
    ["quantitative", "ms", 1, "seconds", "mixed", "high", false],
    ["quantitative", "ms", null, null, "unknown", "unresolved", true],
    ["quantitative", "ms", null, null, "not-applicable", "high", true],
    ["quantitative", "ms", null, null, "unknown", "none", false],
    ["qualitative", null, "bounded", null, "mixed", "high", true],
    ["ordinal", null, "first", null, "mixed", "high", true],
    ["ordinal", null, 3, null, "mixed", "high", false],
    ["qualitative", "ms", "bounded", "ms", "mixed", "high", false],
  ])(
    "checks scale=%s unit=%s value=%s cellUnit=%s rating=%s uncertainty=%s",
    async (scale, unit, value, cellUnit, rating, uncertainty, accepted) => {
      const model = await guideModel();
      const guide = model.decisionGuides[0]!.data;
      const criterion = (guide.evaluation_criteria as Record<string, unknown>[])[0]!;
      Object.assign(criterion, { scale, unit });
      for (const cell of guide.tradeoff_matrix as Record<string, unknown>[])
        cell.assessment = { value, unit: cellUnit, rating, uncertainty };
      const errors = validateDecisionGuides(model).diagnostics.filter(
        (d) => d.code === "DG_MEASUREMENT_INCOMPATIBLE",
      );
      expect(errors.length === 0).toBe(accepted);
    },
  );
  it("enforces the reusable-condition type while retaining edge-local text", async () => {
    const model = await guideModel();
    const cell = (model.decisionGuides[0]!.data.tradeoff_matrix as Record<string, unknown>[])[0]!;
    const conditions = cell.conditions as Record<string, unknown>[];
    conditions[0] = { ...conditions[0], scope: "reusable-concept", concept_ids: ["AKC-900001"] };
    expect(validateDecisionGuides(model).diagnostics.map((d) => d.code)).toContain(
      "DG_CONCEPT_TYPE",
    );
    conditions[0]!.concept_ids = ["AKC-900005"];
    expect(validateDecisionGuides(model).diagnostics).toEqual([]);
  });
});
