import { guideModel } from "./decision-guide-helpers.js";

// Deliberately synthetic, ephemeral inputs; never production guide content.
export async function recommendationFixture() {
  const model = await guideModel();
  const guide = model.decisionGuides[0]!.data;
  const claim = model.claims[0]!.data;
  claim.source_locations = [{ source_id: "AKS-900001", locator: "Synthetic paragraph" }];
  const bound = { conditions: structuredClone(claim.conditions), claim_ids: ["AKL-900001"] };
  guide.recommended_when = [{ option_id: "AKC-900004", rationale: "Synthetic", ...bound }];
  guide.avoid_when = [{ option_id: "AKC-900001", rationale: "Synthetic", ...bound }];
  const authority = {
    recommendation_only: true,
    human_decision_required: true,
    automation_may_approve: false,
  };
  const session = {
    contract_version: 3,
    guide_version: 1,
    session_id: "11111111-1111-4111-8111-111111111111",
    guide_id: "AKG-900001",
    context: [
      {
        key: "classification",
        value: "one" as unknown,
        classification: "internal",
        provenance: "human-provided",
        confirmed_by_human: true,
      },
    ],
    drivers: [] as Record<string, unknown>[],
    constraints: [{ concept_id: "AKC-900005", satisfied: true as boolean | null, notes: null }],
    condition_evaluations: (claim.conditions as Record<string, unknown>[]).map((condition) => ({
      condition: structuredClone(condition),
      satisfied: true as boolean | null,
      confirmed_by_human: true,
    })),
    privacy: {
      persistence: "ephemeral-only",
      external_provider_authorized: false,
      external_provider_authorization: null,
      redacted_keys: [],
    },
    authority,
  };
  const statement = {
    statement: "Synthetic scoped comparison",
    claim_ids: ["AKL-900001"],
    option_ids: ["AKC-900004"],
  };
  const output = {
    contract_version: 4,
    inapplicable_options: [] as { concept_id: string; reason: string }[],
    guide_version: 1,
    decision_basis: [
      "/options/0",
      "/options/1",
      "/constraints/0",
      "/assumptions/0",
      "/recommended_when/0",
      "/disqualifiers/0",
      "/avoid_when/0",
    ].map((guide_pointer) => ({ guide_pointer, claim_ids: ["AKL-900001"] })),
    session_id: session.session_id,
    guide_id: session.guide_id,
    status: "recommendation",
    applicable_context: structuredClone(session.context),
    constraint_results: [
      {
        concept_id: "AKC-900005",
        hardness: "hard",
        status: "satisfied",
        rationale: "Synthetic",
        claim_ids: ["AKL-900001"],
      },
    ],
    viable_options: ["AKC-900004"],
    rejected_options: [
      { concept_id: "AKC-900001", reason: "Synthetic disqualifier", claim_ids: ["AKL-900001"] },
    ],
    tradeoffs: [structuredClone(statement)],
    risks: [],
    verification: [structuredClone(statement)],
    evolution_triggers: [],
    uncertainty: [
      {
        statement: "Synthetic evidence has low confidence",
        basis: "low-confidence",
        claim_ids: ["AKL-900001"],
      },
    ],
    claim_ids: ["AKL-900001"],
    source_ids: ["AKS-900001"],
    evidence_claims: [structuredClone(claim)],
    authority,
  };
  return { model, session, output };
}
