import { KNOWLEDGE_ID_PATTERN, type DecisionEvaluationInput } from "../../contracts/src/index.js";
import type { DecisionPort } from "./decision-port.js";
import { AppError } from "./errors.js";
import { OperationLimiter } from "./operation-limiter.js";

export class DecisionService {
  constructor(
    private readonly decisions: DecisionPort,
    private readonly limiter = new OperationLimiter(),
  ) {}

  get commit() {
    return this.decisions.commit;
  }

  guides() {
    return this.decisions.decisionGuides();
  }

  intake(guideId: string) {
    this.validateGuideId(guideId);
    return this.decisions.decisionIntake(guideId);
  }

  evaluate(submission: DecisionEvaluationInput) {
    const input = structuredClone(submission);
    if (input.repository_commit !== this.commit)
      throw new AppError(
        "SNAPSHOT_CHANGED",
        409,
        "The knowledge snapshot changed. Reopen the decision intake before evaluating.",
      );
    if (!Number.isSafeInteger(input.client_revision) || input.client_revision < 0)
      throw new AppError(
        "INVALID_REVISION",
        400,
        "Client revision must be a non-negative integer.",
      );
    this.validateGuideId(input.session.guide_id);
    return this.limiter.run(async () => ({
      client_revision: input.client_revision,
      ...(await this.decisions.evaluateDecision(input.session)),
    }));
  }

  private validateGuideId(id: string) {
    if (!new RegExp(KNOWLEDGE_ID_PATTERN).test(id) || !id.startsWith("AKG-"))
      throw new AppError("INVALID_ID", 400, "Use a registered opaque decision-guide ID.");
  }
}
