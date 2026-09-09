import type { RepositoryModel } from "../src/model.js";
import { conceptRecord, recordFromData, validSemanticModel } from "./helpers.js";

export async function guideModel(): Promise<RepositoryModel> {
  const model = await validSemanticModel();
  const constraint = conceptRecord("AKC-900005", "Synthetic Constraint", "constraint");
  const assumption = conceptRecord("AKC-900006", "Synthetic Assumption", "assumption");
  model.concepts.push(constraint, assumption);
  model.records.push(constraint, assumption);
  const claim = model.claims[0]!;
  claim.data.status = "sourced";
  claim.data.applicable_concept_ids = model.concepts.map((concept) => concept.id);
  const condition = {
    statement: "The bounded synthetic condition holds.",
    scope: "edge-local",
    concept_ids: [],
  };
  const bound = { conditions: [condition], claim_ids: [claim.id] };
  const guide = recordFromData(
    {
      schema_version: 4,
      id: "AKG-900001",
      record_kind: "decision-guide",
      title: "Synthetic Decision Guide",
      decision_question: "Which synthetic option fits the bounded fixture?",
      context_variables: [
        {
          key: "classification",
          question: "What classification applies?",
          description: "Synthetic context.",
          value_type: "enum",
          required: true,
          sensitivity: "internal",
          unit: null,
          allowed_values: ["one", "two"],
        },
      ],
      constraints: [
        { concept_id: constraint.id, hardness: "hard", rationale: "Synthetic bound.", ...bound },
      ],
      assumptions: [{ concept_id: assumption.id, validation_question: "Does it hold?", ...bound }],
      quality_attributes: [
        {
          concept_id: "AKC-900002",
          priority: "high",
          rationale: "Synthetic quality.",
          conditions: [condition],
          claim_ids: [claim.id],
        },
      ],
      options: [
        {
          concept_id: "AKC-900001",
          label: "Option one",
          summary: "First fixture option.",
          ...bound,
        },
        {
          concept_id: "AKC-900004",
          label: "Option two",
          summary: "Second fixture option.",
          ...bound,
        },
      ],
      evaluation_criteria: [
        {
          key: "quality",
          question: "How is quality affected?",
          quality_attribute_id: "AKC-900002",
          scale: "qualitative",
          direction: "higher-is-better",
          unit: null,
          conditions: [condition],
          claim_ids: [claim.id],
        },
      ],
      tradeoff_matrix: ["AKC-900001", "AKC-900004"].map((option_id) => ({
        option_id,
        criterion: "quality",
        assessment: {
          rating: "mixed",
          rationale: "Synthetic assessment.",
          value: null,
          unit: null,
          uncertainty: "high",
        },
        ...bound,
      })),
      disqualifiers: [{ option_id: "AKC-900001", rationale: "Synthetic disqualifier.", ...bound }],
      risk_questions: [
        {
          question: "What synthetic risk remains?",
          affected_option_ids: ["AKC-900001"],
          conditions: [condition],
          claim_ids: [claim.id],
        },
      ],
      recommended_when: [{ option_id: "AKC-900001", rationale: "Synthetic condition.", ...bound }],
      avoid_when: [{ option_id: "AKC-900004", rationale: "Synthetic condition.", ...bound }],
      evolution_triggers: [
        {
          condition,
          rationale: "Revisit the fixture.",
          affected_option_ids: ["AKC-900001", "AKC-900004"],
          claim_ids: [claim.id],
        },
      ],
      evidence: [claim.id],
      uncertainty_policy: {
        missing_evidence: "insufficient-evidence",
        conflicting_evidence: "preserve-conflict-and-escalate",
        unknown_context: "request-clarification",
        tie: "escalate-human",
      },
      privacy: {
        allowed_context_classifications: ["internal"],
        external_provider_policy: "prohibited",
        session_persistence: "ephemeral-only",
      },
      authority: {
        recommendation_only: true,
        human_decision_required: true,
        automation_may_approve: false,
        generated_artifact_status: "draft",
      },
      status: "proposed",
      review: {
        owner: null,
        reviewers: [],
        created_at: "2026-09-02",
        updated_at: "2026-09-02",
        reviewed_at: null,
        review_due_at: null,
      },
      version: 1,
    },
    "tests/fixtures/synthetic/AKG-900001.yaml",
  );
  model.decisionGuides = [guide];
  model.records.push(guide);
  return model;
}
