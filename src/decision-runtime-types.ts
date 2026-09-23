export type DecisionRuntimeStatus =
  | "recommendation"
  | "multiple-viable-options"
  | "insufficient-evidence"
  | "needs-human-clarification";

export interface DecisionGuideCatalogItem {
  id: string;
  version: number;
  title: string;
  decision_question: string;
  lifecycle_status: "proposed";
  option_ids: string[];
  authority: {
    recommendation_only: true;
    human_decision_required: true;
    automation_may_approve: false;
  };
}

export interface DecisionConditionPrompt {
  key: string;
  condition: {
    statement: string;
    scope: string;
    concept_ids: string[];
  };
  question: string;
}

export interface DecisionGuideIntake {
  guide: DecisionGuideCatalogItem;
  context_variables: unknown[];
  constraints: unknown[];
  quality_attributes: unknown[];
  conditions: DecisionConditionPrompt[];
  privacy: {
    allowed_context_classifications: string[];
    external_provider_policy: "prohibited";
    session_persistence: "ephemeral-only";
  };
}

export interface DecisionClarificationPrompt {
  kind: "context" | "constraint" | "condition" | "confirmation";
  key: string;
  question: string;
}

export interface DecisionEvaluationResult {
  status: DecisionRuntimeStatus;
  recommendation: Record<string, unknown>;
  clarification_prompts: DecisionClarificationPrompt[];
}

export interface DecisionRuntime {
  listGuides(): DecisionGuideCatalogItem[];
  intake(guideId: string): DecisionGuideIntake;
  evaluate(session: unknown): Promise<DecisionEvaluationResult>;
}

export class DecisionRuntimeError extends Error {
  constructor(
    public readonly code:
      | "DECISION_GUIDE_NOT_ENABLED"
      | "DECISION_RUNTIME_UNAVAILABLE"
      | "DECISION_RUNTIME_INPUT_INVALID"
      | "DECISION_RUNTIME_OUTPUT_INVALID",
  ) {
    super(code);
    this.name = "DecisionRuntimeError";
  }
}
