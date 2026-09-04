import { diagnostic, type Diagnostic } from "./diagnostics.js";
import { asArray, asString, asStringArray, isPlainObject } from "./io.js";
import type { RecordEntry, RepositoryModel } from "./model.js";

export interface DecisionGuideAnalysis {
  diagnostics: Diagnostic[];
  guide_count: number;
  evidence_binding_count: number;
  matrix_cell_count: number;
}

interface EvidenceBinding {
  path: string;
  claimIds: string[];
  conceptIds: string[];
  conditions: string[];
}

export function validateDecisionGuides(model: RepositoryModel): DecisionGuideAnalysis {
  const diagnostics: Diagnostic[] = [];
  let evidenceBindingCount = 0;
  let matrixCellCount = 0;
  const concepts = new Map(model.concepts.map((record) => [record.id, record]));
  const claims = new Map(model.claims.map((record) => [record.id, record]));
  const sources = new Map(model.sources.map((record) => [record.id, record]));

  for (const guide of model.decisionGuides) {
    const data = guide.data;
    const optionIds = uniqueKeyCheck(
      diagnostics,
      guide,
      "DG_OPTION_DUPLICATE",
      "options",
      asArray(data.options)
        .filter(isPlainObject)
        .map((item) => asString(item.concept_id)),
    );
    const criteria = asArray(data.evaluation_criteria).filter(isPlainObject);
    const criterionKeys = uniqueKeyCheck(
      diagnostics,
      guide,
      "DG_CRITERION_DUPLICATE",
      "evaluation criteria",
      criteria.map((item) => asString(item.key)),
    );
    uniqueKeyCheck(
      diagnostics,
      guide,
      "DG_CONTEXT_KEY_DUPLICATE",
      "context variables",
      asArray(data.context_variables)
        .filter(isPlainObject)
        .map((item) => asString(item.key)),
    );

    const bindings: EvidenceBinding[] = [];
    bindConceptList(
      bindings,
      data.constraints,
      "constraints",
      "constraint",
      concepts,
      diagnostics,
      guide,
    );
    bindConceptList(
      bindings,
      data.assumptions,
      "assumptions",
      ["assumption", "context-condition"],
      concepts,
      diagnostics,
      guide,
    );
    bindConceptList(
      bindings,
      data.quality_attributes,
      "quality_attributes",
      "quality-attribute",
      concepts,
      diagnostics,
      guide,
    );
    bindConceptList(bindings, data.options, "options", undefined, concepts, diagnostics, guide);

    for (const [index, criterion] of criteria.entries()) {
      const qualityId = asString(criterion.quality_attribute_id);
      if (qualityId) {
        checkConceptType(
          qualityId,
          "quality-attribute",
          concepts,
          diagnostics,
          guide,
          `/evaluation_criteria/${index}/quality_attribute_id`,
        );
      }
      bindings.push(
        binding(criterion, `/evaluation_criteria/${index}`, qualityId ? [qualityId] : []),
      );
    }

    const expectedCells = new Set(
      optionIds.flatMap((option) => criterionKeys.map((key) => `${option}|${key}`)),
    );
    const actualCells = new Set<string>();
    const criterionByKey = new Map(criteria.map((item) => [asString(item.key), item] as const));
    for (const [index, cell] of asArray(data.tradeoff_matrix).filter(isPlainObject).entries()) {
      matrixCellCount += 1;
      const optionId = asString(cell.option_id) ?? "";
      const criterionKey = asString(cell.criterion) ?? "";
      const signature = `${optionId}|${criterionKey}`;
      if (!expectedCells.has(signature)) {
        add(
          diagnostics,
          guide,
          "DG_MATRIX_UNEXPECTED_CELL",
          `Unexpected matrix cell '${signature}'.`,
          `/tradeoff_matrix/${index}`,
        );
      } else if (actualCells.has(signature)) {
        add(
          diagnostics,
          guide,
          "DG_MATRIX_DUPLICATE_CELL",
          `Duplicate matrix cell '${signature}'.`,
          `/tradeoff_matrix/${index}`,
        );
      }
      actualCells.add(signature);
      const criterion = criterionByKey.get(criterionKey);
      const qualityId =
        criterion && isPlainObject(criterion)
          ? asString(criterion.quality_attribute_id)
          : undefined;
      bindings.push(
        binding(
          cell,
          `/tradeoff_matrix/${index}`,
          [optionId, ...(qualityId ? [qualityId] : [])].filter(Boolean),
        ),
      );
    }
    for (const signature of expectedCells) {
      if (!actualCells.has(signature)) {
        add(
          diagnostics,
          guide,
          "DG_MATRIX_MISSING_CELL",
          `Missing matrix cell '${signature}'.`,
          "/tradeoff_matrix",
        );
      }
    }

    for (const property of ["disqualifiers", "recommended_when", "avoid_when"] as const) {
      for (const [index, rule] of asArray(data[property]).filter(isPlainObject).entries()) {
        const optionId = asString(rule.option_id) ?? "";
        checkDeclaredOption(
          optionId,
          optionIds,
          diagnostics,
          guide,
          `/${property}/${index}/option_id`,
        );
        bindings.push(binding(rule, `/${property}/${index}`, [optionId].filter(Boolean)));
      }
    }
    for (const property of ["risk_questions", "evolution_triggers"] as const) {
      for (const [index, item] of asArray(data[property]).filter(isPlainObject).entries()) {
        const affected = asStringArray(item.affected_option_ids);
        for (const optionId of affected) {
          checkDeclaredOption(
            optionId,
            optionIds,
            diagnostics,
            guide,
            `/${property}/${index}/affected_option_ids`,
          );
        }
        bindings.push(binding(item, `/${property}/${index}`, affected));
      }
    }

    evidenceBindingCount += bindings.length;
    const usedClaims = new Set(bindings.flatMap((item) => item.claimIds));
    const inventory = new Set(asStringArray(data.evidence));
    for (const claimId of usedClaims) {
      if (!inventory.has(claimId))
        add(
          diagnostics,
          guide,
          "DG_EVIDENCE_INVENTORY_MISSING",
          `Bound claim '${claimId}' is absent from evidence.`,
          "/evidence",
        );
    }
    for (const claimId of inventory) {
      if (!usedClaims.has(claimId))
        add(
          diagnostics,
          guide,
          "DG_EVIDENCE_INVENTORY_UNUSED",
          `Evidence claim '${claimId}' is not bound to guide semantics.`,
          "/evidence",
        );
    }

    for (const item of bindings) {
      for (const claimId of item.claimIds) {
        const claim = claims.get(claimId);
        if (!claim) {
          add(
            diagnostics,
            guide,
            "DG_CLAIM_UNRESOLVED",
            `Claim '${claimId}' does not resolve.`,
            item.path,
          );
          continue;
        }
        if (asString(claim.data.status) !== "sourced") {
          add(
            diagnostics,
            guide,
            "DG_CLAIM_NOT_SOURCED",
            `Claim '${claimId}' must have status 'sourced'.`,
            item.path,
          );
        }
        if (!isGrounded(claimId, claims, sources, new Set())) {
          add(
            diagnostics,
            guide,
            "DG_CLAIM_NOT_GROUNDED",
            `Claim '${claimId}' is not transitively grounded in an admitted source.`,
            item.path,
          );
        }
        for (const conceptId of item.conceptIds) {
          if (!claimAppliesTo(claim, conceptId)) {
            add(
              diagnostics,
              guide,
              "DG_CLAIM_APPLICABILITY",
              `Claim '${claimId}' does not apply to '${conceptId}'.`,
              item.path,
            );
          }
        }
        const preserved = new Set(item.conditions.map(normalize));
        for (const condition of asArray(claim.data.conditions).filter(isPlainObject)) {
          const statement = asString(condition.statement);
          if (statement && !preserved.has(normalize(statement))) {
            add(
              diagnostics,
              guide,
              "DG_CLAIM_CONDITION_LOST",
              `Binding for '${claimId}' omits claim condition '${statement}'.`,
              item.path,
            );
          }
        }
      }
    }

    const allowed = new Set(
      asStringArray(
        isPlainObject(data.privacy) ? data.privacy.allowed_context_classifications : [],
      ),
    );
    for (const [index, variable] of asArray(data.context_variables)
      .filter(isPlainObject)
      .entries()) {
      const sensitivity = asString(variable.sensitivity);
      if (sensitivity && !allowed.has(sensitivity)) {
        add(
          diagnostics,
          guide,
          "DG_PRIVACY_CLASSIFICATION",
          `Context classification '${sensitivity}' is not allowed by the guide privacy policy.`,
          `/context_variables/${index}/sensitivity`,
        );
      }
    }
  }

  return {
    diagnostics,
    guide_count: model.decisionGuides.length,
    evidence_binding_count: evidenceBindingCount,
    matrix_cell_count: matrixCellCount,
  };
}

function binding(
  value: Record<string, unknown>,
  path: string,
  conceptIds: string[],
): EvidenceBinding {
  return {
    path,
    claimIds: asStringArray(value.claim_ids),
    conceptIds,
    conditions: [
      ...asArray(value.conditions),
      ...(isPlainObject(value.condition) ? [value.condition] : []),
    ]
      .filter(isPlainObject)
      .map((item) => asString(item.statement))
      .filter((item): item is string => Boolean(item)),
  };
}

function bindConceptList(
  output: EvidenceBinding[],
  value: unknown,
  property: string,
  expectedType: string | string[] | undefined,
  concepts: Map<string, RecordEntry>,
  diagnostics: Diagnostic[],
  guide: RecordEntry,
): void {
  for (const [index, item] of asArray(value).filter(isPlainObject).entries()) {
    const conceptId = asString(item.concept_id) ?? "";
    if (expectedType)
      checkConceptType(
        conceptId,
        expectedType,
        concepts,
        diagnostics,
        guide,
        `/${property}/${index}/concept_id`,
      );
    else if (!concepts.has(conceptId))
      add(
        diagnostics,
        guide,
        "DG_CONCEPT_UNRESOLVED",
        `Concept '${conceptId}' does not resolve.`,
        `/${property}/${index}/concept_id`,
      );
    output.push(binding(item, `/${property}/${index}`, [conceptId].filter(Boolean)));
  }
}

function checkConceptType(
  id: string,
  expected: string | string[],
  concepts: Map<string, RecordEntry>,
  diagnostics: Diagnostic[],
  guide: RecordEntry,
  pointer: string,
): void {
  const concept = concepts.get(id);
  if (!concept)
    return add(
      diagnostics,
      guide,
      "DG_CONCEPT_UNRESOLVED",
      `Concept '${id}' does not resolve.`,
      pointer,
    );
  const allowed = Array.isArray(expected) ? expected : [expected];
  const actual = asString(concept.data.type);
  if (!actual || !allowed.includes(actual))
    add(
      diagnostics,
      guide,
      "DG_CONCEPT_TYPE",
      `Concept '${id}' has type '${actual ?? "missing"}', expected ${allowed.join(" or ")}.`,
      pointer,
    );
}

function uniqueKeyCheck(
  diagnostics: Diagnostic[],
  guide: RecordEntry,
  code: string,
  label: string,
  values: (string | undefined)[],
): string[] {
  const seen = new Set<string>();
  const valid: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) add(diagnostics, guide, code, `Duplicate ${label} key '${value}'.`);
    else {
      seen.add(value);
      valid.push(value);
    }
  }
  return valid;
}

function checkDeclaredOption(
  id: string,
  options: string[],
  diagnostics: Diagnostic[],
  guide: RecordEntry,
  pointer: string,
): void {
  if (!options.includes(id))
    add(
      diagnostics,
      guide,
      "DG_OPTION_UNDECLARED",
      `Option '${id}' is not declared by the guide.`,
      pointer,
    );
}

function claimAppliesTo(claim: RecordEntry, conceptId: string): boolean {
  if (asString(claim.data.subject) === conceptId) return true;
  const object = isPlainObject(claim.data.object) ? claim.data.object : {};
  return (
    asString(object.record_id) === conceptId ||
    asStringArray(claim.data.applicable_concept_ids).includes(conceptId)
  );
}

function isGrounded(
  id: string,
  claims: Map<string, RecordEntry>,
  sources: Map<string, RecordEntry>,
  visiting: Set<string>,
): boolean {
  if (visiting.has(id)) return false;
  const claim = claims.get(id);
  if (!claim) return false;
  if (asString(claim.data.status) !== "sourced") return false;
  const sourceIds = asStringArray(claim.data.sources);
  const directGrounded = sourceIds.every((sourceId) =>
    ["approved", "restricted"].includes(asString(sources.get(sourceId)?.data.status) ?? ""),
  );
  if (!directGrounded) return false;
  const derivedIds = asStringArray(claim.data.derived_from_claims);
  if (sourceIds.length === 0 && derivedIds.length === 0) return false;
  const next = new Set(visiting);
  next.add(id);
  return derivedIds.every((parent) => isGrounded(parent, claims, sources, next));
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function add(
  items: Diagnostic[],
  guide: RecordEntry,
  code: string,
  message: string,
  pointer?: string,
): void {
  items.push(diagnostic(code, "error", guide.path, message, pointer));
}
