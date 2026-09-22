import type {
  DecisionEvaluationOutput,
  DecisionGuideIntake,
  DecisionGuideSummary,
  DecisionSession,
} from "../../contracts/src/index.js";

export interface DecisionPort {
  readonly commit: string;
  decisionGuides(): Promise<DecisionGuideSummary[]>;
  decisionIntake(guideId: string): Promise<DecisionGuideIntake>;
  evaluateDecision(
    session: DecisionSession,
  ): Promise<Omit<DecisionEvaluationOutput, "client_revision">>;
}
