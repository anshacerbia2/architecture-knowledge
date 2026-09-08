import { beforeAll, describe, expect, it } from "vitest";
import { decisionConditionKey, validateDecisionGuides } from "../src/decision-guide-validator.js";
import { guideModel } from "./decision-guide-helpers.js";

let base: Awaited<ReturnType<typeof guideModel>>;
beforeAll(async () => {
  base = await guideModel();
});
function reusableModel() {
  const model = structuredClone(base);
  const condition = {
    statement: "The bounded synthetic condition holds.",
    scope: "reusable-concept",
    concept_ids: ["AKC-900005", "AKC-900006"],
  };
  model.claims[0]!.data.conditions = [structuredClone(condition)];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (record.statement === condition.statement && "scope" in record)
        Object.assign(record, structuredClone(condition));
      Object.values(record).forEach(walk);
    }
  };
  walk(model.decisionGuides[0]!.data);
  return { model, condition };
}
describe("M7.1-AUD-005 structured condition identity", () => {
  it("preserves set identity regardless of ID order or whitespace", () => {
    const { model, condition } = reusableModel();
    const rule = (model.decisionGuides[0]!.data.recommended_when as Record<string, unknown>[])[0]!;
    rule.conditions = [
      {
        ...condition,
        statement: "  The bounded   synthetic condition holds.  ",
        concept_ids: [...condition.concept_ids].reverse(),
      },
    ];
    expect(validateDecisionGuides(model).diagnostics).toEqual([]);
    expect(decisionConditionKey(condition)).toBe(
      decisionConditionKey((rule.conditions as unknown[])[0]),
    );
  });
  it.each(["scope", "subset", "substitution", "text", "case"])(
    "rejects %s changes despite valid reference types",
    (kind) => {
      const { model, condition } = reusableModel();
      const changed = structuredClone(condition);
      if (kind === "scope") changed.scope = "edge-local";
      if (kind === "subset") changed.concept_ids = ["AKC-900005"];
      if (kind === "substitution") changed.concept_ids = ["AKC-900006"];
      if (kind === "text") changed.statement = "The bounded synthetic condition does not hold.";
      if (kind === "case") changed.statement = changed.statement.toUpperCase();
      (model.decisionGuides[0]!.data.recommended_when as Record<string, unknown>[])[0]!.conditions =
        [changed];
      const diagnostics = validateDecisionGuides(model).diagnostics;
      expect(diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "DG_CLAIM_CONDITION_LOST",
            pointer: "/recommended_when/0",
          }),
        ]),
      );
    },
  );
  it("retains the genuine edge-local positive control", () => {
    expect(validateDecisionGuides(base).diagnostics).toEqual([]);
  });
  it("does not throw on malformed conditions passed to the semantic helper", () => {
    expect(typeof decisionConditionKey(null)).toBe("string");
    expect(decisionConditionKey({ statement: 4 })).not.toBe(
      decisionConditionKey({ statement: "4", scope: "edge-local", concept_ids: [] }),
    );
  });
});
