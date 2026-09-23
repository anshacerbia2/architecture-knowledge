import { beforeAll, expect, it } from "vitest";
import { loadDecisionRuntimeSnapshot } from "../src/decision-runtime.js";
import type { DecisionRuntime } from "../src/decision-runtime-types.js";
let runtime: DecisionRuntime;
beforeAll(async () => {
  runtime = await loadDecisionRuntimeSnapshot(process.cwd());
});

it.each(["AKG-000001", "AKG-000002", "AKG-000003"])(
  "validates every complete boolean assessment for %s without an operational failure",
  async (guideId) => {
    const intake = runtime.intake(guideId);
    const guide = intake.guide;
    const counts: Record<string, number> = {};
    for (let mask = 0; mask < 2 ** intake.conditions.length; mask++) {
      const session = {
        contract_version: 3,
        session_id: "88888888-8888-4888-8888-888888888888",
        guide_id: guide.id,
        guide_version: guide.version,
        context: intake.context_variables.map((entry) => {
          const item = entry as Record<string, unknown>;
          return {
            key: item.key,
            value: "Synthetic exhaustive condition test",
            classification: item.sensitivity,
            provenance: "human-provided",
            confirmed_by_human: true,
          };
        }),
        drivers: [],
        constraints: intake.constraints.map((entry) => ({
          concept_id: (entry as Record<string, unknown>).concept_id,
          satisfied: true,
          notes: null,
        })),
        condition_evaluations: intake.conditions.map(({ condition }, index) => ({
          condition,
          satisfied: Boolean(mask & (1 << index)),
          confirmed_by_human: true,
        })),
        privacy: {
          persistence: "ephemeral-only",
          external_provider_authorized: false,
          external_provider_authorization: null,
          redacted_keys: [],
        },
        authority: {
          recommendation_only: true,
          human_decision_required: true,
          automation_may_approve: false,
        },
      };
      const result = await runtime.evaluate(session);
      counts[result.status] = (counts[result.status] ?? 0) + 1;
      expect(result.recommendation.authority).toEqual(session.authority);
      if (result.status === "insufficient-evidence")
        expect(result.recommendation.viable_options).toEqual([]);
      else expect(result.recommendation.viable_options).not.toEqual([]);
    }
    expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(
      2 ** intake.conditions.length,
    );
    expect(counts["insufficient-evidence"]).toBeGreaterThan(0);
    expect(counts["recommendation"]).toBeGreaterThan(0);
    expect(counts["multiple-viable-options"]).toBeGreaterThan(0);
  },
);
