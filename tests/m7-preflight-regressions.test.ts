import { beforeAll, describe, expect, it } from "vitest";
import { validateDecisionRecommendation } from "../src/decision-recommendation-validator.js";
import { recommendationFixture } from "./decision-recommendation-helpers.js";

type Fixture = Awaited<ReturnType<typeof recommendationFixture>>;
let base: Fixture;
beforeAll(async () => {
  base = await recommendationFixture();
});
const check = (f: Fixture) => validateDecisionRecommendation(f.model, f.session, f.output);

describe("M7.1 final preflight boundaries", () => {
  it.each(["session", "output"] as const)(
    "rejects automation approval in the current %s contract",
    async (target) => {
      const f = structuredClone(base);
      expect(await check(f)).toEqual([]);
      f[target].authority.automation_may_approve = true;
      expect(await check(f)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "SCHEMA_INSTANCE",
            pointer: "/authority/automation_may_approve",
          }),
        ]),
      );
    },
  );
  it("does not reuse same-text confirmation for a different structured condition", async () => {
    const f = structuredClone(base);
    expect(await check(f)).toEqual([]);
    const evaluation = f.session.condition_evaluations[0]!;
    evaluation.condition.scope = "reusable-concept";
    evaluation.condition.concept_ids = ["AKC-900005"];
    const diagnostics = await check(f);
    expect(diagnostics.some((d) => d.code === "SCHEMA_INSTANCE")).toBe(false);
    expect(diagnostics.map((d) => d.code)).toEqual(
      expect.arrayContaining(["DR_CONDITION_INVENTORY", "DR_RECOMMENDATION_NOT_APPLICABLE"]),
    );
  });
  it("requires confirmation of additional mandatory binding conditions", async () => {
    const f = structuredClone(base);
    const extra = { statement: "Synthetic extra assumption", scope: "edge-local", concept_ids: [] };
    const assumption = (
      f.model.decisionGuides[0]!.data.assumptions as Record<string, unknown>[]
    )[0]!;
    (assumption.conditions as unknown[]).push(extra);
    expect((await check(f)).map((d) => d.code)).toContain("DR_BASIS_CONDITION");
    f.session.condition_evaluations.push({
      condition: extra,
      satisfied: true,
      confirmed_by_human: true,
    });
    expect(await check(f)).toEqual([]);
    f.session.condition_evaluations[1]!.confirmed_by_human = false;
    expect((await check(f)).map((d) => d.code)).toContain("DR_BASIS_CONDITION");
  });
  it("rejects duplicated confirmation instead of allowing the last value to win", async () => {
    const f = structuredClone(base);
    expect(await check(f)).toEqual([]);
    f.session.condition_evaluations.unshift({
      ...structuredClone(f.session.condition_evaluations[0]!),
      satisfied: false,
    });
    expect((await check(f)).map((d) => d.code)).toContain("DR_CONDITION_INVENTORY");
  });
});
