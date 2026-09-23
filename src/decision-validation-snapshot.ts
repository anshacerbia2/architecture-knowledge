import { hasErrors } from "./diagnostics.js";
import {
  createDecisionRecommendationValidator,
  type DecisionRecommendationValidator,
} from "./decision-recommendation-validator.js";
import { analyzeRepository, diagnosticsFor } from "./kernel.js";

/** Startup-only loader. The trusted local host owns root selection and commit
 * pinning. No caller-supplied model or validation flag is accepted as authority.
 * The returned validator retains private, detached records and compiled schemas;
 * it performs no IO, persists no session and grants no decision approval.
 */
export async function loadDecisionValidationSnapshot(
  root: string,
): Promise<DecisionRecommendationValidator> {
  try {
    const analysis = await analyzeRepository(root);
    if (hasErrors(diagnosticsFor(analysis))) throw new Error("DECISION_SNAPSHOT_INVALID");
    return createDecisionRecommendationValidator(analysis.model, analysis.schema.documents);
  } catch {
    // Startup diagnostics may contain local paths or invalid repository values.
    throw new Error("DECISION_SNAPSHOT_INVALID");
  }
}
