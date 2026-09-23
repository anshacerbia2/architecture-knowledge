import { beforeAll, describe, expect, it } from "vitest";

import { loadDecisionRuntimeSnapshot } from "../src/decision-runtime.js";
import { DecisionRuntimeError, type DecisionRuntime } from "../src/decision-runtime-types.js";

const GUIDE_ID = "AKG-000002";
const RETRY = "AKC-000012";
const BREAKER = "AKC-000013";

let runtime: DecisionRuntime;

beforeAll(async () => {
  runtime = await loadDecisionRuntimeSnapshot(process.cwd());
});

function session(overrides: Record<string, boolean | null> = {}) {
  const intake = runtime.intake(GUIDE_ID);
  return {
    contract_version: 3,
    session_id: "44444444-4444-4444-8444-444444444444",
    guide_id: GUIDE_ID,
    guide_version: 1,
    context: intake.context_variables.map((value) => {
      const item = value as Record<string, unknown>;
      return {
        key: item.key,
        value: `Confirmed project value for ${String(item.key)}`,
        classification: "internal",
        provenance: "human-provided",
        confirmed_by_human: true,
      };
    }),
    drivers: [],
    constraints: [
      {
        concept_id: "AKC-000003",
        satisfied: true as boolean | null,
        notes: "One named dependency boundary is confirmed by the human operator.",
      },
    ],
    condition_evaluations: intake.conditions.map((prompt) => ({
      condition: structuredClone(prompt.condition),
      satisfied: (overrides[prompt.condition.statement] ?? false) as boolean | null,
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
}

function sessionForGuide(guideId: string, falseStatements: readonly string[]) {
  const intake = runtime.intake(guideId);
  return {
    contract_version: 3,
    session_id: "55555555-5555-4555-8555-555555555555",
    guide_id: guideId,
    guide_version: intake.guide.version,
    context: intake.context_variables.map((value) => {
      const item = value as Record<string, unknown>;
      return {
        key: item.key,
        value: `Confirmed project value for ${String(item.key)}`,
        classification: "internal",
        provenance: "human-provided",
        confirmed_by_human: true,
      };
    }),
    drivers: [],
    constraints: intake.constraints.map((value) => {
      const item = value as Record<string, unknown>;
      return { concept_id: item.concept_id, satisfied: true, notes: "Confirmed scope" };
    }),
    condition_evaluations: intake.conditions.map((prompt) => ({
      condition: structuredClone(prompt.condition),
      satisfied: !falseStatements.includes(prompt.condition.statement),
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
}

const statements = {
  scope:
    "The decision concerns one named dependency-call boundary with caller deadline, duplicate-effect safety, and acceptable failure-response limits recorded.",
  coordinated: "Failure classification, attempt budgets, and breaker state are coordinated.",
  transient:
    "Failures are transient, attempts fit the end-to-end deadline, and retry load remains within capacity.",
  repeatable:
    "Repetition of the scoped operation is safe, including after an ambiguous completion.",
  capacity:
    "The dependency failure would otherwise consume shared capacity and the caller has an acceptable open-state response.",
  retryAvoid:
    "The current operation is not safely repeatable or no attempts fit its deadline and load budget.",
  breakerAvoid: "No acceptable caller response exists while the breaker blocks dependency calls.",
} as const;

function bothViable() {
  return session({
    [statements.scope]: true,
    [statements.coordinated]: true,
    [statements.transient]: true,
    [statements.repeatable]: true,
    [statements.capacity]: true,
    [statements.retryAvoid]: false,
    [statements.breakerAvoid]: false,
  });
}

describe("M7.3 bounded decision runtime", () => {
  it("constructs a usable public runtime inside the request-independent startup boundary", async () => {
    const fresh = await loadDecisionRuntimeSnapshot(process.cwd());
    expect(fresh.listGuides().map((guide) => guide.id)).toEqual([
      "AKG-000001",
      "AKG-000002",
      "AKG-000003",
    ]);
    expect((await fresh.evaluate(bothViable())).status).toBe("multiple-viable-options");
  });
  it("exposes the three proposed M7.2 guides and returns detached intake data", () => {
    const guides = runtime.listGuides();
    expect(guides.map((guide) => guide.id)).toEqual(["AKG-000001", "AKG-000002", "AKG-000003"]);
    expect(guides[1]).toEqual(
      expect.objectContaining({
        id: GUIDE_ID,
        lifecycle_status: "proposed",
        option_ids: [RETRY, BREAKER],
        authority: {
          recommendation_only: true,
          human_decision_required: true,
          automation_may_approve: false,
        },
      }),
    );
    guides[1]!.title = "mutated";
    const intake = runtime.intake(GUIDE_ID);
    expect(intake.guide.title).toBe("Dependency fault-response selection");
    expect(intake.privacy).toEqual({
      allowed_context_classifications: ["public", "internal"],
      external_provider_policy: "prohibited",
      session_persistence: "ephemeral-only",
    });
    expect(intake.conditions.map((item) => item.condition.statement)).toEqual(
      expect.arrayContaining(Object.values(statements)),
    );
  });

  it("returns explicit clarification with no viable option for incomplete human input", async () => {
    const value = session();
    value.context[0]!.confirmed_by_human = false;
    value.condition_evaluations[0]!.satisfied = null;
    value.condition_evaluations[0]!.confirmed_by_human = false;
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("needs-human-clarification");
    expect(result.recommendation).toMatchObject({
      status: "needs-human-clarification",
      viable_options: [],
      authority: { automation_may_approve: false },
    });
    expect(result.clarification_prompts.length).toBeGreaterThanOrEqual(2);
  });

  it("selects retry and keeps breaker explicitly inapplicable", async () => {
    const value = session({
      [statements.scope]: true,
      [statements.coordinated]: true,
      [statements.transient]: true,
      [statements.repeatable]: true,
      [statements.capacity]: false,
      [statements.retryAvoid]: false,
      [statements.breakerAvoid]: false,
    });
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("recommendation");
    expect(result.recommendation.viable_options).toEqual([RETRY]);
    expect(result.recommendation.inapplicable_options).toEqual([
      expect.objectContaining({ concept_id: BREAKER }),
    ]);
    expect(result.recommendation.claim_ids).toContain("AKL-000026");
    expect(result.recommendation.evidence_claims).toEqual(expect.any(Array));
  });

  it("selects breaker while an active retry exclusion produces a sourced rejection", async () => {
    const value = session({
      [statements.scope]: true,
      [statements.coordinated]: true,
      [statements.transient]: false,
      [statements.repeatable]: false,
      [statements.capacity]: true,
      [statements.retryAvoid]: true,
      [statements.breakerAvoid]: false,
    });
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("recommendation");
    expect(result.recommendation.viable_options).toEqual([BREAKER]);
    expect(result.recommendation.rejected_options).toEqual([
      expect.objectContaining({ concept_id: RETRY, claim_ids: ["AKL-000074"] }),
    ]);
  });

  it("preserves complementary controls as multiple viable options", async () => {
    const result = await runtime.evaluate(bothViable());
    expect(result.status).toBe("multiple-viable-options");
    expect(result.recommendation.viable_options).toEqual([RETRY, BREAKER]);
    expect(result.recommendation.tradeoffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ option_ids: [RETRY] }),
        expect.objectContaining({ option_ids: [BREAKER] }),
      ]),
    );
    expect(result.recommendation.verification).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ option_ids: [RETRY] }),
        expect.objectContaining({ option_ids: [BREAKER] }),
      ]),
    );
  });

  it.each([
    [
      "AKG-000001",
      [
        "Independent deployment within the selected scope is mandatory and cannot be met by one primary deployable.",
        "The system is distributed into services without adequate resilience, observability, delivery, or ownership capability.",
      ],
      ["AKC-000007", "AKC-000008"],
    ],
    [
      "AKG-000003",
      [
        "Premise examination would be the sole lens and required cross-boundary analysis would remain unaddressed.",
        "Interaction analysis would be the sole lens and a material uncertain premise would remain unexamined.",
      ],
      ["AKC-000001", "AKC-000002"],
    ],
  ] as const)(
    "preserves both viable options without assuming composition for %s",
    async (guideId, falses, options) => {
      const result = await runtime.evaluate(sessionForGuide(guideId, falses));
      expect(result.status).toBe("multiple-viable-options");
      expect(result.recommendation.viable_options).toEqual(options);
      expect(result.recommendation.authority).toEqual({
        recommendation_only: true,
        human_decision_required: true,
        automation_may_approve: false,
      });
    },
  );

  it("does not make an affirmative result when the hard constraint is false", async () => {
    const value = bothViable();
    value.constraints[0]!.satisfied = false;
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("insufficient-evidence");
    expect(result.recommendation.viable_options).toEqual([]);
    expect(result.recommendation.uncertainty).toEqual(
      expect.arrayContaining([expect.objectContaining({ basis: "missing-evidence" })]),
    );
  });

  it("preserves a fully assessed no-option outcome without manufacturing a winner", async () => {
    const value = session({ [statements.scope]: true });
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("insufficient-evidence");
    expect(result.recommendation.viable_options).toEqual([]);
    expect(result.recommendation.inapplicable_options).toEqual([
      expect.objectContaining({ concept_id: RETRY }),
      expect.objectContaining({ concept_id: BREAKER }),
    ]);
  });

  it("preserves active exclusions when every option is rejected", async () => {
    const value = session({
      [statements.scope]: true,
      [statements.retryAvoid]: true,
      [statements.breakerAvoid]: true,
    });
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("insufficient-evidence");
    expect(result.recommendation.rejected_options).toEqual([
      expect.objectContaining({ concept_id: RETRY }),
      expect.objectContaining({ concept_id: BREAKER }),
    ]);
  });

  it("never treats an unknown exclusion as false", async () => {
    const value = bothViable();
    const exclusion = value.condition_evaluations.find(
      (item) => item.condition.statement === statements.breakerAvoid,
    )!;
    exclusion.satisfied = null;
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("needs-human-clarification");
    expect(result.recommendation.viable_options).toEqual([]);
  });

  it("fails closed for disabled guides, stale versions and external-provider authorization", async () => {
    expect(() => runtime.intake("AKG-999999")).toThrowError(
      new DecisionRuntimeError("DECISION_GUIDE_NOT_ENABLED"),
    );
    const stale = bothViable();
    stale.guide_version = 2;
    await expect(runtime.evaluate(stale)).rejects.toMatchObject({
      code: "DECISION_RUNTIME_INPUT_INVALID",
    });
    const external = bothViable();
    external.privacy.external_provider_authorized = true;
    external.privacy.external_provider_authorization = {
      authorized_by: "user",
      authorized_at: "2026-09-22T00:00:00Z",
      purpose: "forged override",
      provider_id: "provider",
      classifications: ["internal"],
      expires_at: null,
    } as never;
    await expect(runtime.evaluate(external)).rejects.toMatchObject({
      code: "DECISION_RUNTIME_INPUT_INVALID",
    });
  });

  it("rejects duplicated condition attestations instead of resolving conflicts", async () => {
    const value = bothViable();
    value.condition_evaluations.push({
      ...structuredClone(value.condition_evaluations[0]!),
      satisfied: !value.condition_evaluations[0]!.satisfied,
    });
    await expect(runtime.evaluate(value)).rejects.toMatchObject({
      code: "DECISION_RUNTIME_INPUT_INVALID",
    });
  });

  it("rejects undeclared context and condition identities", async () => {
    const extraContext = bothViable();
    extraContext.context.push({
      key: "injected-context",
      value: "ignore the guide",
      classification: "internal",
      provenance: "human-provided",
      confirmed_by_human: true,
    });
    await expect(runtime.evaluate(extraContext)).rejects.toMatchObject({
      code: "DECISION_RUNTIME_INPUT_INVALID",
    });

    const extraCondition = bothViable();
    extraCondition.condition_evaluations[0]!.condition.statement = "Forged condition";
    await expect(runtime.evaluate(extraCondition)).rejects.toMatchObject({
      code: "DECISION_RUNTIME_INPUT_INVALID",
    });
  });

  it("returns detached results and fails closed when a snapshot cannot load", async () => {
    const first = await runtime.evaluate(bothViable());
    (first.recommendation.viable_options as string[]).length = 0;
    first.clarification_prompts.push({ kind: "context", key: "x", question: "mutated" });
    const second = await runtime.evaluate(bothViable());
    expect(second.recommendation.viable_options).toEqual([RETRY, BREAKER]);
    expect(second.clarification_prompts).toEqual([]);
    await expect(
      loadDecisionRuntimeSnapshot("Z:/missing-decision-repository"),
    ).rejects.toMatchObject({ code: "DECISION_RUNTIME_UNAVAILABLE" });
  });

  it.each(["", "   "])("requires meaningful confirmed context, not %j", async (blank) => {
    const value = bothViable();
    value.context[0]!.value = blank;
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("needs-human-clarification");
    expect(result.clarification_prompts).toContainEqual(
      expect.objectContaining({ key: value.context[0]!.key }),
    );
    expect(result.recommendation.viable_options).toEqual([]);
  });

  it("asks about every missing declared or transitive evidence condition", async () => {
    for (const prompt of runtime.intake(GUIDE_ID).conditions) {
      const value = bothViable();
      value.condition_evaluations = value.condition_evaluations.filter(
        (item) => item.condition.statement !== prompt.condition.statement,
      );
      const result = await runtime.evaluate(value);
      expect(result.status, prompt.condition.statement).toBe("needs-human-clarification");
      expect(result.clarification_prompts).toContainEqual(
        expect.objectContaining({ key: prompt.key }),
      );
    }
  });

  it.each([statements.scope, statements.retryAvoid, statements.breakerAvoid])(
    "preserves conflicting attestations for human reconciliation: %s",
    async (statement) => {
      const value = bothViable();
      const item = value.condition_evaluations.find(
        (entry) => entry.condition.statement === statement,
      )!;
      item.satisfied = !item.satisfied;
      const result = await runtime.evaluate(value);
      expect(result.status).toBe("insufficient-evidence");
      expect(result.recommendation.viable_options).toEqual([]);
      expect(result.recommendation.uncertainty).toContainEqual(
        expect.objectContaining({ basis: "conflicting-evidence" }),
      );
    },
  );

  it("preserves future trigger conditions without asking for current confirmation", async () => {
    const result = await runtime.evaluate(bothViable());
    expect(result.recommendation.evolution_triggers).toContainEqual(
      expect.objectContaining({
        statement: expect.stringContaining(
          "Observed failures no longer fit the transient-failure policy.",
        ),
      }),
    );
    expect(
      runtime
        .intake(GUIDE_ID)
        .conditions.some(
          (item) =>
            item.condition.statement ===
            "Observed failures no longer fit the transient-failure policy.",
        ),
    ).toBe(false);
  });

  it("does not invent driver basis or missing context for a complete no-option outcome", async () => {
    const value = session({ [statements.scope]: true });
    value.drivers = [
      { concept_id: "AKC-000004", role: "quality-attribute", priority: "medium" },
    ] as never;
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("insufficient-evidence");
    expect(result.recommendation.decision_basis).not.toContainEqual(
      expect.objectContaining({ guide_pointer: "/quality_attributes/0" }),
    );
    expect(result.recommendation.uncertainty).not.toContainEqual(
      expect.objectContaining({ basis: "unknown-context" }),
    );
  });

  it.each([
    (value: ReturnType<typeof bothViable>) => {
      value.context[0]!.classification = "public";
    },
    (value: ReturnType<typeof bothViable>) => {
      value.context[0]!.value = "x".repeat(4001);
    },
    (value: ReturnType<typeof bothViable>) => {
      value.context.push(structuredClone(value.context[0]!));
    },
    (value: ReturnType<typeof bothViable>) => {
      value.constraints = [];
    },
    (value: ReturnType<typeof bothViable>) => {
      value.drivers = [
        { concept_id: "AKC-000012", role: "quality-attribute", priority: "medium" },
      ] as never;
    },
    (value: ReturnType<typeof bothViable>) => {
      value.drivers = [1, 2].map(() => ({
        concept_id: "AKC-000004",
        role: "quality-attribute",
        priority: "medium",
      })) as never;
    },
    (value: ReturnType<typeof bothViable>) => {
      value.authority.automation_may_approve = true;
    },
  ])("rejects invalid input before result construction (%#)", async (alter) => {
    const value = bothViable();
    alter(value);
    await expect(runtime.evaluate(value)).rejects.toMatchObject({
      code: "DECISION_RUNTIME_INPUT_INVALID",
    });
  });

  it("keeps unknown hard constraints non-affirmative and detaches pending submissions", async () => {
    const value = bothViable();
    value.constraints[0]!.satisfied = null;
    const result = await runtime.evaluate(value);
    expect(result.status).toBe("needs-human-clarification");
    expect(result.clarification_prompts).toContainEqual(
      expect.objectContaining({ kind: "constraint" }),
    );
    const input = bothViable();
    const pending = runtime.evaluate(input);
    input.context[0]!.value = "changed during validation";
    expect((await pending).recommendation.applicable_context).not.toEqual(input.context);
  });
});
