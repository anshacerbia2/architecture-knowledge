import { diagnostic, hasErrors, type Diagnostic } from "./diagnostics.js";
import { asArray, asStringArray, isPlainObject } from "./io.js";
import type { RepositoryModel } from "./model.js";
import { validateSchemas } from "./schema-validator.js";
import { validateDecisionGuides } from "./decision-guide-validator.js";
import { validateEvidence } from "./evidence-validator.js";
import { serializeGraphValue } from "./graph-projector.js";

type ObjectValue = Record<string, unknown>;
const objects = (value: unknown): ObjectValue[] => asArray(value).filter(isPlainObject);
const equal = (a: unknown, b: unknown): boolean =>
  serializeGraphValue(a) === serializeGraphValue(b);

/** Validation only. The supplied repository model is data, not an authority attestation.
 * CLI callers additionally run the full repository kernel. Nothing is persisted or approved.
 */
export async function validateDecisionRecommendation(
  model: RepositoryModel,
  sessionInput: unknown,
  recommendationInput: unknown,
): Promise<Diagnostic[]> {
  const inputs = [
    {
      path: "decision-session.json",
      schemaRef: "schemas/decision-session.schema.json",
      data: sessionInput,
    },
    {
      path: "decision-recommendation.json",
      schemaRef: "schemas/decision-recommendation.schema.json",
      data: recommendationInput,
    },
  ];
  const schema = await validateSchemas({
    ...model,
    governedFiles: inputs.map((input) => ({
      ...input,
      absolutePath: `${model.root}/${input.path}`,
      format: "json" as const,
    })),
  });
  if (hasErrors(schema.diagnostics)) return schema.diagnostics;
  const session = sessionInput as ObjectValue;
  const output = recommendationInput as ObjectValue;
  const diagnostics: Diagnostic[] = [];
  const fail = (code: string, pointer: string): void => {
    diagnostics.push(
      diagnostic(
        code,
        "error",
        "decision-recommendation.json",
        "Decision contract invariant failed; input values are not logged.",
        pointer,
      ),
    );
  };
  const guideRecord = model.decisionGuides.find((record) => record.id === output.guide_id);
  if (!guideRecord) {
    fail("DR_GUIDE_UNRESOLVED", "/guide_id");
    return diagnostics;
  }
  if (session.guide_id !== guideRecord.id || session.session_id !== output.session_id)
    fail("DR_SESSION_MISMATCH", "/session_id");
  const evidence = validateEvidence(model);
  diagnostics.push(
    ...validateDecisionGuides(model).diagnostics,
    ...evidence.claimDiagnostics,
    ...evidence.sourceDiagnostics,
  );
  // Do not allow malformed model evidence to bypass syntax through the reusable API.
  const records = [guideRecord, ...model.claims, ...model.sources];
  diagnostics.push(
    ...(
      await validateSchemas({
        ...model,
        governedFiles: records.map((record) => ({
          path: record.path,
          absolutePath: `${model.root}/${record.path}`,
          format: "json" as const,
          data: record.data,
          schemaRef: `schemas/${record.recordKind}.schema.json`,
        })),
      })
    ).diagnostics,
  );
  if (hasErrors(diagnostics)) return diagnostics;

  const guide = guideRecord.data;
  const affirmative = ["recommendation", "multiple-viable-options"].includes(String(output.status));
  const viable = asStringArray(output.viable_options);
  const rejected = objects(output.rejected_options);
  const options = objects(guide.options).map((item) => String(item.concept_id));
  const partition = [...viable, ...rejected.map((item) => String(item.concept_id))];
  if (new Set(partition).size !== partition.length || partition.some((id) => !options.includes(id)))
    fail("DR_OPTION_PARTITION", "/viable_options");
  if (affirmative && options.some((id) => !partition.includes(id)))
    fail("DR_OPTION_OMITTED", "/rejected_options");
  if (output.status === "recommendation" && viable.length !== 1)
    fail("DR_STATUS_CARDINALITY", "/viable_options");

  const context = objects(session.context);
  const variables = objects(guide.context_variables);
  if (!equal(output.applicable_context, session.context))
    fail("DR_CONTEXT_MISMATCH", "/applicable_context");
  if (new Set(context.map((item) => item.key)).size !== context.length)
    fail("DR_CONTEXT_DUPLICATE", "/applicable_context");
  for (const item of context) {
    const variable = variables.find((variable) => variable.key === item.key);
    if (!variable || variable.sensitivity !== item.classification) {
      fail("DR_CONTEXT_DECLARATION", "/applicable_context");
      continue;
    }
    const value = item.value;
    const numeric = ["number", "duration", "data-size"].includes(String(variable.value_type));
    const valid =
      value === null
        ? !affirmative
        : numeric
          ? typeof value === "number" && Number.isFinite(value)
          : variable.value_type === "integer"
            ? Number.isInteger(value)
            : variable.value_type === "enum"
              ? asArray(variable.allowed_values).includes(value)
              : typeof value === variable.value_type;
    if (!valid || (affirmative && item.confirmed_by_human !== true))
      fail("DR_CONTEXT_VALUE", "/applicable_context");
  }
  if (
    affirmative &&
    variables.some(
      (variable) => variable.required && !context.some((item) => item.key === variable.key),
    )
  )
    fail("DR_CONTEXT_REQUIRED", "/applicable_context");

  const constraints = objects(guide.constraints);
  const results = objects(output.constraint_results);
  const supplied = objects(session.constraints);
  for (const items of [results, supplied]) {
    const ids = items.map((item) => item.concept_id);
    if (
      new Set(ids).size !== ids.length ||
      !equal([...ids].sort(), constraints.map((item) => item.concept_id).sort())
    )
      fail("DR_CONSTRAINT_INVENTORY", "/constraint_results");
  }
  for (const result of results) {
    const constraint = constraints.find((item) => item.concept_id === result.concept_id);
    const input = supplied.find((item) => item.concept_id === result.concept_id);
    const status =
      input?.satisfied === true
        ? "satisfied"
        : input?.satisfied === false
          ? "unsatisfied"
          : "unknown";
    if (!constraint || constraint.hardness !== result.hardness || result.status !== status)
      fail("DR_CONSTRAINT_MISMATCH", "/constraint_results");
    if (affirmative && constraint?.hardness === "hard" && status !== "satisfied")
      fail("DR_HARD_CONSTRAINT", "/constraint_results");
  }

  const knownConditions = new Set<string>();
  const collectConditions = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(collectConditions);
    else if (isPlainObject(value)) {
      if (
        typeof value.statement === "string" &&
        typeof value.scope === "string" &&
        Array.isArray(value.concept_ids)
      )
        knownConditions.add(serializeGraphValue(value));
      Object.values(value).forEach(collectConditions);
    }
  };
  collectConditions(guide);
  const evaluations = objects(session.condition_evaluations);
  const byCondition = new Map<string, ObjectValue>();
  for (const evaluation of evaluations) {
    const key = serializeGraphValue(evaluation.condition);
    if (byCondition.has(key) || !knownConditions.has(key))
      fail("DR_CONDITION_INVENTORY", "/condition_evaluations");
    byCondition.set(key, evaluation);
  }
  const conditionHolds = (condition: unknown): boolean | null => {
    const item = byCondition.get(serializeGraphValue(condition));
    return item?.confirmed_by_human === true && typeof item.satisfied === "boolean"
      ? item.satisfied
      : null;
  };
  const ruleHolds = (rule: ObjectValue): boolean | null => {
    const states = asArray(rule.conditions).map(conditionHolds);
    return states.includes(false) ? false : states.includes(null) ? null : true;
  };
  if (affirmative)
    for (const id of viable) {
      if (
        !objects(guide.recommended_when).some(
          (rule) => rule.option_id === id && ruleHolds(rule) === true,
        )
      )
        fail("DR_RECOMMENDATION_NOT_APPLICABLE", "/viable_options");
      if (
        [...objects(guide.disqualifiers), ...objects(guide.avoid_when)].some(
          (rule) => rule.option_id === id && ruleHolds(rule) !== false,
        )
      )
        fail("DR_OPTION_DISQUALIFIED_OR_UNKNOWN", "/viable_options");
    }

  const claims = new Map(model.claims.map((record) => [record.id, record]));
  const sources = new Map(model.sources.map((record) => [record.id, record]));
  if (
    claims.size !== model.claims.length ||
    sources.size !== model.sources.length ||
    new Set(model.decisionGuides.map((g) => g.id)).size !== model.decisionGuides.length
  )
    fail("DR_MODEL_DUPLICATE", "/guide_id");
  const bindings = [
    ...results.map((item) => ({ item, targets: [String(item.concept_id)] })),
    ...rejected.map((item) => ({ item, targets: [String(item.concept_id)] })),
    ...["tradeoffs", "risks", "verification", "evolution_triggers"].flatMap((key) =>
      objects(output[key]).map((item) => ({ item, targets: viable })),
    ),
  ];
  const roots = [...new Set(bindings.flatMap(({ item }) => asStringArray(item.claim_ids)))].sort();
  if (!equal(roots, asStringArray(output.claim_ids).sort()))
    fail("DR_CLAIM_INVENTORY", "/claim_ids");
  const chain = new Set<string>();
  const usedSources = new Set<string>();
  const visit = (id: string, visiting: Set<string>): void => {
    if (visiting.has(id)) {
      fail("DR_EVIDENCE_CYCLE", "/claim_ids");
      return;
    }
    if (chain.has(id)) return;
    const claim = claims.get(id);
    if (!claim || claim.data.status !== "sourced") {
      fail("DR_CLAIM_UNRESOLVED", "/claim_ids");
      return;
    }
    chain.add(id);
    const direct = asStringArray(claim.data.sources);
    const parents = asStringArray(claim.data.derived_from_claims);
    if (!direct.length && !parents.length) fail("DR_EVIDENCE_UNGROUNDED", "/claim_ids");
    for (const sourceId of direct) {
      const source = sources.get(sourceId);
      if (!source || !["approved", "restricted"].includes(String(source.data.status)))
        fail("DR_SOURCE_NOT_ADMITTED", "/source_ids");
      if (
        !objects(claim.data.source_locations).some(
          (location) =>
            location.source_id === sourceId &&
            typeof location.locator === "string" &&
            location.locator.trim(),
        )
      )
        fail("DR_SOURCE_LOCATOR_MISSING", "/evidence_claims");
      usedSources.add(sourceId);
    }
    parents.forEach((parent) => visit(parent, new Set(visiting).add(id)));
  };
  roots.forEach((id) => visit(id, new Set()));
  for (const item of objects(output.uncertainty))
    if (asStringArray(item.claim_ids).some((id) => !chain.has(id)))
      fail("DR_UNCERTAINTY_REFERENCE", "/uncertainty");
  if (!equal([...usedSources].sort(), asStringArray(output.source_ids).sort()))
    fail("DR_SOURCE_INVENTORY", "/source_ids");
  const snapshots = objects(output.evidence_claims);
  if (
    snapshots.length !== chain.size ||
    !equal(snapshots.map((item) => item.id).sort(), [...chain].sort()) ||
    snapshots.some((item) => !equal(item, claims.get(String(item.id))?.data))
  )
    fail("DR_EVIDENCE_SNAPSHOT", "/evidence_claims");
  for (const { item, targets } of bindings)
    for (const id of asStringArray(item.claim_ids)) {
      const claim = claims.get(id)?.data;
      if (!claim || !asStringArray(guide.evidence).includes(id)) {
        fail("DR_EVIDENCE_OUTSIDE_GUIDE", "/claim_ids");
        continue;
      }
      const object = isPlainObject(claim.object) ? claim.object : {};
      if (
        targets.some(
          (target) =>
            claim.subject !== target &&
            object.record_id !== target &&
            !asStringArray(claim.applicable_concept_ids).includes(target),
        )
      )
        fail("DR_CLAIM_APPLICABILITY", "/claim_ids");
      if (
        affirmative &&
        asArray(claim.conditions).some((condition) => conditionHolds(condition) !== true)
      )
        fail("DR_CLAIM_CONDITION", "/evidence_claims");
    }
  // Preserve low-confidence evidence throughout the derivation, not only direct bindings.
  for (const id of chain) {
    const claim = claims.get(id)!.data;
    if (
      affirmative &&
      asArray(claim.conditions).some((condition) => conditionHolds(condition) !== true)
    )
      fail("DR_CLAIM_CONDITION", "/evidence_claims");
    if (
      claim.confidence === "low" &&
      !objects(output.uncertainty).some(
        (item) => item.basis === "low-confidence" && asStringArray(item.claim_ids).includes(id),
      )
    )
      fail("DR_UNCERTAINTY_LOST", "/uncertainty");
  }
  return diagnostics;
}
