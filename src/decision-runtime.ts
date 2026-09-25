import { hasErrors } from "./diagnostics.js";
import { createDecisionRecommendationValidator } from "./decision-recommendation-validator.js";
import { decisionConditionKey } from "./decision-guide-validator.js";
import {
  DecisionRuntimeError,
  type DecisionClarificationPrompt,
  type DecisionConditionPrompt,
  type DecisionEvaluationResult,
  type DecisionGuideCatalogItem,
  type DecisionGuideIntake,
  type DecisionRuntime,
} from "./decision-runtime-types.js";
import { asArray, asStringArray, isPlainObject } from "./io.js";
import { analyzeRepository, diagnosticsFor } from "./kernel.js";
import type { RepositoryModel } from "./model.js";
import { createSchemaValidator } from "./schema-validator.js";

type ObjectValue = Record<string, unknown>;
type RuleState = true | false | null;

const PILOT_GUIDE_IDS = ["AKG-000001", "AKG-000002", "AKG-000003"] as const;
const AUTHORITY = Object.freeze({
  recommendation_only: true as const,
  human_decision_required: true as const,
  automation_may_approve: false as const,
});

const objects = (value: unknown): ObjectValue[] => asArray(value).filter(isPlainObject);
const clone = <T>(value: T): T => structuredClone(value);

/** Load the bounded decision runtime from one fully validated repository snapshot. */
export async function loadDecisionRuntimeSnapshot(root: string): Promise<DecisionRuntime> {
  try {
    const analysis = await analyzeRepository(root);
    if (hasErrors(diagnosticsFor(analysis))) throw new Error("invalid snapshot");
    return createDecisionRuntime(analysis.model, analysis.schema.documents);
  } catch {
    throw new DecisionRuntimeError("DECISION_RUNTIME_UNAVAILABLE");
  }
}

/** Composition primitive for tests and trusted startup code; not an authority attestation. */
export function createDecisionRuntime(
  modelInput: RepositoryModel,
  schemaDocuments: ReadonlyMap<string, unknown>,
): DecisionRuntime {
  const model = clone(modelInput);
  const validateRecommendation = createDecisionRecommendationValidator(model, schemaDocuments);
  const validateSchema = createSchemaValidator(schemaDocuments);
  const enabledGuides = new Map<string, ObjectValue>(
    PILOT_GUIDE_IDS.map((id) => {
      const record = model.decisionGuides.find((guide) => guide.id === id);
      if (!record || record.data.status !== "proposed")
        throw new DecisionRuntimeError("DECISION_RUNTIME_INPUT_INVALID");
      return [id, record.data] as const;
    }),
  );

  const runtime: DecisionRuntime = {
    listGuides() {
      return [...enabledGuides.values()].map(catalogItem);
    },
    intake(guideId: string) {
      const guide = enabledGuides.get(guideId);
      if (!guide) throw new DecisionRuntimeError("DECISION_GUIDE_NOT_ENABLED");
      return buildIntake(guide, model);
    },
    async evaluate(sessionInput: unknown) {
      const session = clone(sessionInput);
      const schema = validateSchema({
        diagnostics: [],
        governedFiles: [
          {
            path: "decision-session.json",
            absolutePath: `${model.root}/decision-session.json`,
            schemaRef: "schemas/decision-session.schema.json",
            data: session,
            format: "json",
          },
        ],
      });
      if (hasErrors(schema.diagnostics) || !isPlainObject(session)) {
        throw new DecisionRuntimeError("DECISION_RUNTIME_INPUT_INVALID");
      }
      const guide = enabledGuides.get(String(session.guide_id));
      if (!guide) throw new DecisionRuntimeError("DECISION_GUIDE_NOT_ENABLED");
      assertSessionBoundary(session, guide, model);
      const result = buildEvaluation(model, guide, session);
      const diagnostics = await validateRecommendation.validate(session, result.recommendation);
      if (hasErrors(diagnostics)) {
        throw new DecisionRuntimeError("DECISION_RUNTIME_OUTPUT_INVALID");
      }
      return clone(result);
    },
  };
  return Object.freeze(runtime);
}

function catalogItem(guide: ObjectValue): DecisionGuideCatalogItem {
  return {
    id: String(guide.id),
    version: Number(guide.version),
    title: String(guide.title),
    decision_question: String(guide.decision_question),
    lifecycle_status: "proposed",
    option_ids: objects(guide.options).map((option) => String(option.concept_id)),
    authority: clone(AUTHORITY),
  };
}

function buildIntake(guide: ObjectValue, model: RepositoryModel): DecisionGuideIntake {
  const conditions = collectCurrentConditions(guide, model);
  return {
    guide: catalogItem(guide),
    context_variables: clone(objects(guide.context_variables)),
    constraints: clone(objects(guide.constraints)),
    quality_attributes: clone(objects(guide.quality_attributes)),
    conditions: [...conditions.values()].map((condition) => ({
      key: decisionConditionKey(condition),
      condition: clone(condition) as DecisionConditionPrompt["condition"],
      question: `Konfirmasi untuk konteks proyek ini: ${String(condition.statement)}`,
    })),
    privacy: {
      allowed_context_classifications: asStringArray(
        isPlainObject(guide.privacy) ? guide.privacy.allowed_context_classifications : [],
      ),
      external_provider_policy: "prohibited",
      session_persistence: "ephemeral-only",
    },
  };
}

function assertSessionBoundary(
  session: ObjectValue,
  guide: ObjectValue,
  model: RepositoryModel,
): void {
  const fail = (): never => {
    throw new DecisionRuntimeError("DECISION_RUNTIME_INPUT_INVALID");
  };
  if (session.guide_version !== guide.version) fail();
  if (
    !isPlainObject(session.privacy) ||
    session.privacy.persistence !== "ephemeral-only" ||
    session.privacy.external_provider_authorized !== false ||
    session.privacy.external_provider_authorization !== null
  )
    fail();
  if (
    !isPlainObject(session.authority) ||
    session.authority.recommendation_only !== true ||
    session.authority.human_decision_required !== true ||
    session.authority.automation_may_approve !== false
  )
    fail();

  const declaredContext = new Map(
    objects(guide.context_variables).map((item) => [String(item.key), item]),
  );
  const context = objects(session.context);
  if (
    new Set(context.map((item) => item.key)).size !== context.length ||
    context.some((item) => {
      const declared = declaredContext.get(String(item.key));
      return (
        !declared ||
        item.classification !== declared.sensitivity ||
        (item.value !== null && typeof item.value !== "string") ||
        (typeof item.value === "string" && item.value.length > 4000)
      );
    })
  )
    fail();

  const drivers = objects(session.drivers);
  if (new Set(drivers.map((item) => item.concept_id)).size !== drivers.length) fail();
  for (const driver of drivers) {
    const members =
      driver.role === "constraint"
        ? objects(guide.constraints)
        : driver.role === "quality-attribute"
          ? objects(guide.quality_attributes)
          : objects(guide.assumptions);
    const member = members.find((item) => item.concept_id === driver.concept_id);
    const concept = model.concepts.find((item) => item.id === driver.concept_id);
    if (
      !member ||
      concept?.data.type !== (driver.role === "context" ? "context-condition" : driver.role) ||
      (driver.role === "constraint" && driver.priority === "required" && member.hardness !== "hard")
    )
      fail();
  }

  const declaredConstraints = objects(guide.constraints)
    .map((item) => String(item.concept_id))
    .sort();
  const suppliedConstraints = objects(session.constraints)
    .map((item) => String(item.concept_id))
    .sort();
  if (JSON.stringify(declaredConstraints) !== JSON.stringify(suppliedConstraints)) fail();

  const seen = new Map<string, ObjectValue>();
  for (const evaluation of objects(session.condition_evaluations)) {
    const key = decisionConditionKey(evaluation.condition);
    const prior = seen.get(key);
    if (prior || !collectCurrentConditions(guide, model).has(key)) fail();
    seen.set(key, evaluation);
  }
}

function buildEvaluation(
  model: RepositoryModel,
  guide: ObjectValue,
  session: ObjectValue,
  evidenceGap?: string,
): DecisionEvaluationResult {
  const context = objects(session.context);
  const constraints = objects(session.constraints);
  const evaluations = new Map(
    objects(session.condition_evaluations).map((item) => [
      decisionConditionKey(item.condition),
      item,
    ]),
  );
  const conditionHolds = (condition: unknown): RuleState => {
    const evaluation = evaluations.get(decisionConditionKey(condition));
    return evaluation?.confirmed_by_human === true && typeof evaluation.satisfied === "boolean"
      ? evaluation.satisfied
      : null;
  };
  const ruleHolds = (rule: ObjectValue): RuleState => {
    const values = asArray(rule.conditions).map(conditionHolds);
    return values.includes(false) ? false : values.includes(null) ? null : true;
  };

  const constraintResults = objects(guide.constraints).map((declared) => {
    const supplied = constraints.find((item) => item.concept_id === declared.concept_id);
    const status =
      supplied?.satisfied === true
        ? "satisfied"
        : supplied?.satisfied === false
          ? "unsatisfied"
          : "unknown";
    return {
      concept_id: String(declared.concept_id),
      hardness: String(declared.hardness),
      status,
      rationale: String(declared.rationale),
      claim_ids: status === "unknown" ? [] : asStringArray(declared.claim_ids),
    };
  });

  const prompts = clarificationPrompts(guide, session, evaluations, model);
  const conflictingConstraint = objects(guide.constraints).some(
    (declared) =>
      constraints.some(
        (item) => item.concept_id === declared.concept_id && item.satisfied === true,
      ) && ruleHolds(declared) === false,
  );
  const conflictingRules = objects(guide.options).some(
    (option) =>
      objects(guide.recommended_when).some(
        (rule) => rule.option_id === option.concept_id && ruleHolds(rule) === true,
      ) &&
      [...objects(guide.avoid_when), ...objects(guide.disqualifiers)].some(
        (rule) => rule.option_id === option.concept_id && ruleHolds(rule) === true,
      ),
  );
  const conflict = conflictingConstraint || conflictingRules;
  const hardFalse = constraintResults.some(
    (item) => item.hardness === "hard" && item.status === "unsatisfied",
  );
  const hardUnknown = constraintResults.some(
    (item) => item.hardness === "hard" && item.status === "unknown",
  );

  let status: DecisionEvaluationResult["status"] =
    hardFalse || conflict || evidenceGap
      ? "insufficient-evidence"
      : prompts.length || hardUnknown
        ? "needs-human-clarification"
        : "insufficient-evidence";
  let viable: string[] = [];
  let rejected: ObjectValue[] = [];
  let inactive: ObjectValue[] = [];

  if (!hardFalse && !hardUnknown && !conflict && !evidenceGap && prompts.length === 0) {
    let unresolved = false;
    for (const option of objects(guide.options)) {
      const id = String(option.concept_id);
      const selection = objects(guide.recommended_when).filter((rule) => rule.option_id === id);
      const exclusions = [...objects(guide.avoid_when), ...objects(guide.disqualifiers)].filter(
        (rule) => rule.option_id === id,
      );
      const selectionStates = selection.map(ruleHolds);
      const exclusionStates = exclusions.map(ruleHolds);
      const activeExclusion = exclusions.find((rule) => ruleHolds(rule) === true);
      if (activeExclusion) {
        rejected.push({
          concept_id: id,
          reason: String(activeExclusion.rationale),
          claim_ids: asStringArray(activeExclusion.claim_ids),
        });
      } else if (
        selectionStates.includes(true) &&
        exclusionStates.every((value) => value === false)
      ) {
        viable.push(id);
      } else if (
        selection.length > 0 &&
        selectionStates.every((value) => value === false) &&
        exclusionStates.every((value) => value === false)
      ) {
        inactive.push({
          concept_id: id,
          reason: "Semua aturan pemilihan dan pengecualian telah dikonfirmasi tidak berlaku.",
        });
      } else {
        unresolved = true;
      }
    }
    if (!unresolved && viable.length > 0) {
      status = viable.length === 1 ? "recommendation" : "multiple-viable-options";
    } else {
      status = unresolved ? "needs-human-clarification" : "insufficient-evidence";
      viable = [];
    }
  }

  const affirmative = status === "recommendation" || status === "multiple-viable-options";
  const partition = [
    ...viable,
    ...rejected.map((item) => String(item.concept_id)),
    ...inactive.map((item) => String(item.concept_id)),
  ];
  const basis = buildDecisionBasis(
    guide,
    session,
    constraintResults,
    partition,
    rejected,
    inactive,
    ruleHolds,
    affirmative,
  );
  const tradeoffs = affirmative
    ? objects(guide.tradeoff_matrix)
        .filter(
          (item) =>
            viable.includes(String(item.option_id)) &&
            asArray(item.conditions).every((condition) => conditionHolds(condition) === true),
        )
        .map((item) => ({
          statement: String(isPlainObject(item.assessment) ? item.assessment.rationale : ""),
          claim_ids: asStringArray(item.claim_ids),
          option_ids: [String(item.option_id)],
        }))
    : [];
  const applicableRiskQuestions = affirmative
    ? objects(guide.risk_questions)
        .filter(
          (item) =>
            asStringArray(item.affected_option_ids).some((id) => viable.includes(id)) &&
            asArray(item.conditions).every((condition) => conditionHolds(condition) === true),
        )
        .map((item) => ({
          statement: String(item.question),
          claim_ids: asStringArray(item.claim_ids),
          option_ids: asStringArray(item.affected_option_ids).filter((id) => viable.includes(id)),
        }))
    : [];
  // These are guide-bound inquiries, not assertions that a project risk occurred.
  const risks = applicableRiskQuestions.map((item) => ({
    ...item,
    statement: `Potential risk to investigate; not verified for this project: ${item.statement}`,
  }));
  const verification = [...applicableRiskQuestions];
  if (affirmative) {
    for (const optionId of viable) {
      if (verification.some((item) => item.option_ids.includes(optionId))) continue;
      const cell = objects(guide.tradeoff_matrix).find(
        (item) =>
          item.option_id === optionId &&
          asArray(item.conditions).every((condition) => conditionHolds(condition) === true),
      );
      const criterion = objects(guide.evaluation_criteria).find(
        (item) => item.key === cell?.criterion && ruleHolds(item) === true,
      );
      if (cell && criterion)
        verification.push({
          statement: String(criterion.question),
          claim_ids: asStringArray(cell.claim_ids),
          option_ids: [optionId],
        });
    }
  }
  const evolution = affirmative
    ? objects(guide.evolution_triggers)
        .filter((item) => asStringArray(item.affected_option_ids).some((id) => viable.includes(id)))
        .map((item) => ({
          statement: `Jika ${String(isPlainObject(item.condition) ? item.condition.statement : "")}: ${String(item.rationale)}`,
          claim_ids: asStringArray(item.claim_ids),
          option_ids: asStringArray(item.affected_option_ids).filter((id) => viable.includes(id)),
        }))
    : [];

  const roots = uniqueSorted([
    ...basis.flatMap((item) => item.claim_ids),
    ...constraintResults.flatMap((item) => item.claim_ids),
    ...rejected.flatMap((item) => asStringArray(item.claim_ids)),
    ...tradeoffs.flatMap((item) => item.claim_ids),
    ...risks.flatMap((item) => item.claim_ids),
    ...verification.flatMap((item) => item.claim_ids),
    ...evolution.flatMap((item) => item.claim_ids),
  ]);
  const evidence = evidenceClosure(model, roots);
  if (affirmative) {
    // False-rule evidence for inactive options is evaluated, not asserted to apply.
    const assertedRoots = basis
      .filter((entry) => {
        const [field, index] = entry.guide_pointer.slice(1).split("/");
        const binding = objects(guide[field!])[Number(index)]!;
        return (
          !["options", "recommended_when", "avoid_when", "disqualifiers"].includes(field!) ||
          !inactive.some((item) => item.concept_id === (binding.option_id ?? binding.concept_id))
        );
      })
      .flatMap((entry) => entry.claim_ids);
    assertedRoots.push(
      ...constraintResults.flatMap((item) => item.claim_ids),
      ...rejected.flatMap((item) => asStringArray(item.claim_ids)),
      ...[...tradeoffs, ...risks, ...verification, ...evolution].flatMap((item) => item.claim_ids),
    );
    const uncovered = viable.some(
      (id) =>
        !tradeoffs.some((item) => item.option_ids.includes(id)) ||
        !verification.some((item) => item.option_ids.includes(id)),
    );
    const unsupported = evidenceClosure(model, assertedRoots).claims.some((claim) =>
      asArray(claim.conditions).some((condition) => conditionHolds(condition) !== true),
    );
    if (uncovered || unsupported)
      return buildEvaluation(
        model,
        guide,
        session,
        "Bukti yang berlaku belum mendukung seluruh perbandingan dan verifikasi opsi; tidak ada rekomendasi afirmatif.",
      );
  }
  const uncertainty = evidence.claims
    .filter((claim) => claim.confidence === "low")
    .map((claim) => ({
      statement: `Bukti ${String(claim.id)} berkeyakinan rendah dan tetap memerlukan penilaian manusia.`,
      basis: "low-confidence",
      claim_ids: [String(claim.id)],
    }));
  if (!affirmative) {
    uncertainty.push({
      statement:
        evidenceGap ??
        (conflict
          ? "Konfirmasi kondisi saling bertentangan: periksa kendala dan aturan pemilihan/pengecualian sebelum mengevaluasi kembali."
          : hardFalse
            ? "Kendala keras dinyatakan tidak terpenuhi; runtime tidak dapat memberikan rekomendasi afirmatif."
            : prompts.length || hardUnknown
              ? "Konteks atau konfirmasi manusia belum lengkap; runtime tidak menebak nilai yang hilang."
              : "Seluruh opsi telah dievaluasi, tetapi tidak ada opsi yang didukung untuk konteks ini."),
      basis: conflict
        ? "conflicting-evidence"
        : hardFalse || evidenceGap || !prompts.length
          ? "missing-evidence"
          : "unknown-context",
      claim_ids: [],
    });
  }

  const recommendation: Record<string, unknown> = {
    contract_version: 4,
    session_id: session.session_id,
    guide_id: guide.id,
    guide_version: guide.version,
    status,
    applicable_context: clone(context),
    constraint_results: constraintResults,
    viable_options: viable,
    rejected_options: rejected,
    inapplicable_options: inactive,
    tradeoffs,
    risks,
    uncertainty,
    verification,
    evolution_triggers: evolution,
    claim_ids: roots,
    source_ids: evidence.sourceIds,
    authority: clone(AUTHORITY),
    evidence_claims: evidence.claims,
    decision_basis: basis,
  };
  return { status, recommendation, clarification_prompts: prompts };
}

function clarificationPrompts(
  guide: ObjectValue,
  session: ObjectValue,
  evaluations: ReadonlyMap<string, ObjectValue>,
  model: RepositoryModel,
): DecisionClarificationPrompt[] {
  const prompts: DecisionClarificationPrompt[] = [];
  const context = new Map(objects(session.context).map((item) => [String(item.key), item]));
  for (const variable of objects(guide.context_variables)) {
    const supplied = context.get(String(variable.key));
    if (
      variable.required === true &&
      (!supplied ||
        supplied.value === null ||
        (typeof supplied.value === "string" && !supplied.value.trim()) ||
        supplied.confirmed_by_human !== true)
    )
      prompts.push({
        kind: supplied ? "confirmation" : "context",
        key: String(variable.key),
        question: String(variable.question),
      });
  }
  for (const declared of objects(guide.constraints)) {
    const supplied = objects(session.constraints).find(
      (item) => item.concept_id === declared.concept_id,
    );
    if (supplied?.satisfied === null)
      prompts.push({
        kind: "constraint",
        key: String(declared.concept_id),
        question: String(objects(declared.conditions)[0]?.statement ?? declared.rationale),
      });
  }
  for (const [key, condition] of collectCurrentConditions(guide, model)) {
    const evaluation = evaluations.get(key);
    if (!evaluation || evaluation.satisfied === null || evaluation.confirmed_by_human !== true)
      prompts.push({
        kind: evaluation ? "confirmation" : "condition",
        key,
        question: `Konfirmasi untuk konteks proyek ini: ${String(condition.statement)}`,
      });
  }
  return prompts;
}

function buildDecisionBasis(
  guide: ObjectValue,
  session: ObjectValue,
  results: ObjectValue[],
  partition: string[],
  rejected: ObjectValue[],
  inactive: ObjectValue[],
  ruleHolds: (rule: ObjectValue) => RuleState,
  affirmative: boolean,
): Array<{ guide_pointer: string; claim_ids: string[] }> {
  const basis: Array<{ guide_pointer: string; claim_ids: string[] }> = [];
  const inactiveIds = new Set(inactive.map((item) => String(item.concept_id)));
  const rejectedIds = new Set(rejected.map((item) => String(item.concept_id)));
  const add = (field: string, predicate: (item: ObjectValue) => boolean): void => {
    objects(guide[field]).forEach((item, index) => {
      if (predicate(item))
        basis.push({
          guide_pointer: `/${field}/${index}`,
          claim_ids: asStringArray(item.claim_ids).sort(),
        });
    });
  };
  add("options", (item) => partition.includes(String(item.concept_id)));
  add("constraints", (item) =>
    results.some((result) => result.concept_id === item.concept_id && result.status !== "unknown"),
  );
  if (affirmative) add("assumptions", () => true);
  const drivers = objects(session.drivers);
  add(
    "quality_attributes",
    (item) => affirmative && drivers.some((driver) => driver.concept_id === item.concept_id),
  );
  add(
    "recommended_when",
    (item) =>
      partition.includes(String(item.option_id)) &&
      (inactiveIds.has(String(item.option_id)) || ruleHolds(item) === true),
  );
  for (const field of ["disqualifiers", "avoid_when"])
    add(
      field,
      (item) =>
        partition.includes(String(item.option_id)) &&
        (inactiveIds.has(String(item.option_id)) ||
          (rejectedIds.has(String(item.option_id)) && ruleHolds(item) === true)),
    );
  return basis;
}

function evidenceClosure(
  model: RepositoryModel,
  roots: readonly string[],
): { claims: ObjectValue[]; sourceIds: string[] } {
  const claims = new Map(model.claims.map((claim) => [claim.id, claim.data]));
  const ids = new Set<string>();
  const visit = (id: string): void => {
    if (ids.has(id)) return;
    ids.add(id);
    asStringArray(claims.get(id)?.derived_from_claims).forEach(visit);
  };
  roots.forEach(visit);
  const snapshots = [...ids].sort().map((id) => clone(claims.get(id)!));
  return {
    claims: snapshots,
    sourceIds: uniqueSorted(snapshots.flatMap((claim) => asStringArray(claim.sources))),
  };
}

function collectCurrentConditions(
  guide: ObjectValue,
  model?: RepositoryModel,
): Map<string, ObjectValue> {
  const conditions = new Map<string, ObjectValue>();
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (isPlainObject(value)) {
      if (
        typeof value.statement === "string" &&
        typeof value.scope === "string" &&
        Array.isArray(value.concept_ids)
      )
        conditions.set(decisionConditionKey(value), value);
      Object.values(value).forEach(collect);
    }
  };
  for (const field of [
    "options",
    "assumptions",
    "quality_attributes",
    "constraints",
    "evaluation_criteria",
    "tradeoff_matrix",
    "recommended_when",
    "avoid_when",
    "disqualifiers",
    "risk_questions",
  ])
    collect(guide[field]);
  if (model) {
    const claims = new Map(model.claims.map((claim) => [claim.id, claim.data]));
    const visited = new Set<string>();
    const visit = (id: string): void => {
      if (visited.has(id)) return;
      visited.add(id);
      const claim = claims.get(id);
      collect(claim?.conditions);
      asStringArray(claim?.derived_from_claims).forEach(visit);
    };
    asStringArray(guide.evidence).forEach(visit);
  }
  return conditions;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
