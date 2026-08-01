import { asArray, asString, asStringArray, isPlainObject } from "./io.js";
import { diagnostic, type Diagnostic } from "./diagnostics.js";
import type { RecordEntry, RepositoryModel } from "./model.js";

const normativeLanguage = /\b(MUST NOT|SHOULD NOT|RECOMMENDED|MUST|SHOULD|MAY)\b/g;
const normativeLanguageGuard = /\b(?:MUST(?: NOT)?|SHOULD(?: NOT)?|RECOMMENDED|MAY)\b/;
const conditionalLanguage = /^(?:when|if)\b/iu;
const exceptionLanguage = /\b(?:unless|except(?:\s+that)?|provided\s+that)\b/iu;
const forceByToken = new Map([
  ["MUST", "must"],
  ["MUST NOT", "must-not"],
  ["SHOULD", "should"],
  ["SHOULD NOT", "should-not"],
  ["RECOMMENDED", "recommended"],
  ["MAY", "may"],
]);

const lifecycleRank = new Map([
  ["proposed", 0],
  ["source-candidate", 1],
  ["sourced", 2],
  ["drafted", 3],
  ["schema-valid", 4],
  ["content-validated", 5],
  ["human-review", 6],
  ["reviewed", 7],
  ["published", 8],
  ["deprecated", 9],
  ["superseded", 10],
]);

function normalized(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normativeForces(value: string | undefined): string[] {
  return [
    ...new Set(
      [...(value ?? "").matchAll(normativeLanguage)]
        .map((match) => forceByToken.get(match[1] ?? ""))
        .filter((force): force is string => Boolean(force)),
    ),
  ];
}

function materialTerms(value: string | undefined): Set<string> {
  const ignored = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "their",
    "this",
    "to",
    "was",
    "when",
    "with",
  ]);
  return new Set(
    normalized(value)
      .toLocaleLowerCase("en")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/u)
      .filter((term) => term.length > 2 && !ignored.has(term)),
  );
}

function preservesQualification(statement: string | undefined, qualification: string): boolean {
  const expected = materialTerms(qualification);
  if (expected.size === 0) return false;
  const actual = materialTerms(statement);
  const matched = [...expected].filter((term) => actual.has(term)).length;
  return matched / expected.size >= 0.6;
}

function isSecuritySensitive(record: RecordEntry): boolean {
  return (
    asString(record.data.domain) === "security-privacy" ||
    asString(record.data.type) === "security-control" ||
    asString(record.data.type) === "protocol"
  );
}

export function validateSecurityClaimBindings(model: RepositoryModel): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const claimById = new Map(model.claims.map((claim) => [claim.id, claim]));
  const sourceById = new Map(model.sources.map((source) => [source.id, source]));
  const supportingStatuses = new Set(
    model.ontology.sourceStatuses
      .filter((status) => status.may_support_claims === true)
      .map((status) => asString(status.key))
      .filter((status): status is string => Boolean(status)),
  );

  for (const concept of model.concepts.filter(isSecuritySensitive)) {
    const declaredClaimIds = new Set(asStringArray(concept.data.claims));
    const declaredSourceIds = new Set(asStringArray(concept.data.sources));
    const implications = asArray(concept.data.security_implications);
    const boundClaimIds = new Set<string>();

    for (const implication of implications) {
      if (typeof implication === "string") {
        if (normativeLanguageGuard.test(implication)) {
          diagnostics.push(
            diagnostic(
              "SECURITY_NORMATIVE_UNSTRUCTURED",
              "error",
              concept.path,
              "Normative security guidance must be a structured implication bound to first-class claims.",
            ),
          );
        }
        continue;
      }
      if (!isPlainObject(implication)) {
        continue;
      }

      const statement = asString(implication.statement);
      const kind = asString(implication.kind);
      const claimIds = asStringArray(implication.claim_ids);
      for (const claimId of claimIds) boundClaimIds.add(claimId);
      const statementForces = normativeForces(statement);
      if (kind !== "normative-control" && statementForces.length > 0) {
        diagnostics.push(
          diagnostic(
            "SECURITY_NORMATIVE_KIND",
            "error",
            concept.path,
            `Structured security guidance containing protocol force must use 'normative-control', not '${kind ?? "missing"}'.`,
          ),
        );
      }
      if (kind === "normative-control" && claimIds.length === 0) {
        diagnostics.push(
          diagnostic(
            "SECURITY_NORMATIVE_CLAIM_REQUIRED",
            "error",
            concept.path,
            "A normative security control requires at least one claim binding.",
          ),
        );
      }

      for (const claimId of claimIds) {
        const claim = claimById.get(claimId);
        if (!claim) {
          diagnostics.push(
            diagnostic(
              "SECURITY_CLAIM_UNRESOLVED",
              "error",
              concept.path,
              `Security implication claim '${claimId}' does not resolve.`,
            ),
          );
          continue;
        }
        if (!declaredClaimIds.has(claimId)) {
          diagnostics.push(
            diagnostic(
              "SECURITY_CLAIM_UNDECLARED",
              "error",
              concept.path,
              `Security implication claim '${claimId}' must also be declared by the knowledge unit.`,
            ),
          );
        }

        const claimSubject = asString(claim.data.subject);
        const applicableConceptIds = new Set(asStringArray(claim.data.applicable_concept_ids));
        if (claimSubject !== concept.id && !applicableConceptIds.has(concept.id)) {
          diagnostics.push(
            diagnostic(
              "SECURITY_CLAIM_APPLICABILITY",
              "error",
              concept.path,
              `Security claim '${claimId}' is neither owned by nor explicitly applicable to concept '${concept.id}'.`,
            ),
          );
        }

        const conceptStatusRank = lifecycleRank.get(asString(concept.data.status) ?? "") ?? -1;
        const claimStatusRank = lifecycleRank.get(asString(claim.data.status) ?? "") ?? -1;
        if (conceptStatusRank >= 2 && claimStatusRank < 2) {
          diagnostics.push(
            diagnostic(
              "SECURITY_CLAIM_STATUS",
              "error",
              concept.path,
              `Sourced security content cannot depend on non-sourced claim '${claimId}'.`,
            ),
          );
        }

        const sourceIds = asStringArray(claim.data.sources);
        const sourceLocations = asArray(claim.data.source_locations).filter(isPlainObject);
        if (kind === "normative-control" && sourceIds.length === 0) {
          diagnostics.push(
            diagnostic(
              "SECURITY_NORMATIVE_DIRECT_SOURCE",
              "error",
              concept.path,
              `Normative security claim '${claimId}' requires direct admitted source evidence; derived claims are supplemental only.`,
            ),
          );
        }
        for (const sourceId of sourceIds) {
          const source = sourceById.get(sourceId);
          const sourceStatus = source ? asString(source.data.status) : undefined;
          if (!sourceStatus || !supportingStatuses.has(sourceStatus)) {
            diagnostics.push(
              diagnostic(
                "SECURITY_CLAIM_EVIDENCE",
                "error",
                concept.path,
                `Security claim '${claimId}' requires admitted direct source '${sourceId}'.`,
              ),
            );
          }
          if (!declaredSourceIds.has(sourceId)) {
            diagnostics.push(
              diagnostic(
                "SECURITY_SOURCE_ADJACENCY",
                "error",
                concept.path,
                `Security claim '${claimId}' source '${sourceId}' must be declared directly by the knowledge unit.`,
              ),
            );
          }
          if (!sourceLocations.some((location) => asString(location.source_id) === sourceId)) {
            diagnostics.push(
              diagnostic(
                "SECURITY_SOURCE_LOCATION",
                "error",
                concept.path,
                `Security claim '${claimId}' requires an exact locator for source '${sourceId}'.`,
              ),
            );
          }
          const sourceDomains = new Set(source ? asStringArray(source.data.domains) : []);
          const conceptDomain = asString(concept.data.domain);
          if (conceptDomain && !sourceDomains.has(conceptDomain)) {
            diagnostics.push(
              diagnostic(
                "SECURITY_SOURCE_SCOPE",
                "error",
                concept.path,
                `Security claim '${claimId}' source '${sourceId}' does not admit the target concept domain '${conceptDomain}'.`,
              ),
            );
          }
        }

        if (kind === "normative-control") {
          const claimStatement = asString(claim.data.statement);
          const normative = isPlainObject(claim.data.normative) ? claim.data.normative : undefined;
          const claimType = asString(claim.data.claim_type);
          if (
            claimType !== "direct-source-claim" &&
            claimType !== "normalized-source-claim" &&
            claimType !== "synthesis"
          ) {
            diagnostics.push(
              diagnostic(
                "SECURITY_NORMATIVE_CLAIM_TYPE",
                "error",
                concept.path,
                `Normative control claim '${claimId}' must be a direct, normalized, or directly sourced synthesis claim, not '${claimType ?? "missing"}'.`,
              ),
            );
          }
          if (normalized(statement) !== normalized(claimStatement) || !normative) {
            diagnostics.push(
              diagnostic(
                "SECURITY_NORMATIVE_SCOPE",
                "error",
                concept.path,
                `Normative implication must exactly preserve the statement and force model of claim '${claimId}'.`,
              ),
            );
            continue;
          }

          const declaredForce = asString(normative.force);
          const claimForces = normativeForces(claimStatement);
          if (
            claimForces.length !== 1 ||
            statementForces.length !== 1 ||
            claimForces[0] !== declaredForce ||
            statementForces[0] !== declaredForce
          ) {
            diagnostics.push(
              diagnostic(
                "SECURITY_NORMATIVE_FORCE",
                "error",
                concept.path,
                `Normative statement and implication for claim '${claimId}' must express exactly its declared force '${declaredForce ?? "missing"}'.`,
              ),
            );
          }

          const conditions = asArray(claim.data.conditions).filter(isPlainObject);
          if (conditionalLanguage.test(claimStatement ?? "") && conditions.length === 0) {
            diagnostics.push(
              diagnostic(
                "SECURITY_NORMATIVE_CONDITION",
                "error",
                concept.path,
                `Conditional normative claim '${claimId}' requires structured conditions.`,
              ),
            );
          }
          for (const condition of conditions) {
            const conditionStatement = asString(condition.statement);
            if (conditionStatement && !preservesQualification(claimStatement, conditionStatement)) {
              diagnostics.push(
                diagnostic(
                  "SECURITY_NORMATIVE_CONDITION",
                  "error",
                  concept.path,
                  `Normative claim '${claimId}' statement does not preserve structured condition '${conditionStatement}'.`,
                ),
              );
            }
          }

          const exceptions = asStringArray(normative.exceptions);
          if (exceptionLanguage.test(claimStatement ?? "") && exceptions.length === 0) {
            diagnostics.push(
              diagnostic(
                "SECURITY_NORMATIVE_EXCEPTION",
                "error",
                concept.path,
                `Qualified normative claim '${claimId}' requires its material exception metadata.`,
              ),
            );
          }
          for (const exception of exceptions) {
            if (!preservesQualification(claimStatement, exception)) {
              diagnostics.push(
                diagnostic(
                  "SECURITY_NORMATIVE_EXCEPTION",
                  "error",
                  concept.path,
                  `Normative claim '${claimId}' statement does not preserve exception '${exception}'.`,
                ),
              );
            }
          }
        } else if (kind === "operational-recommendation") {
          if (
            asString(claim.data.claim_type) !== "recommendation" ||
            isPlainObject(claim.data.normative) ||
            normalized(statement) !== normalized(asString(claim.data.statement))
          ) {
            diagnostics.push(
              diagnostic(
                "SECURITY_RECOMMENDATION_MODEL",
                "error",
                concept.path,
                `Operational recommendation '${claimId}' must exactly project a non-normative recommendation claim.`,
              ),
            );
          }
        }
      }
    }

    for (const claim of model.claims) {
      if (
        !isPlainObject(claim.data.normative) ||
        (lifecycleRank.get(asString(claim.data.status) ?? "") ?? -1) < 2
      ) {
        continue;
      }
      const claimSubject = asString(claim.data.subject);
      const applicableConceptIds = new Set(asStringArray(claim.data.applicable_concept_ids));
      if (
        (claimSubject === concept.id || applicableConceptIds.has(concept.id)) &&
        !boundClaimIds.has(claim.id)
      ) {
        diagnostics.push(
          diagnostic(
            "SECURITY_APPLICABLE_CLAIM_MISSING",
            "error",
            concept.path,
            `Applicable sourced normative claim '${claim.id}' must be projected by the security-sensitive knowledge unit.`,
          ),
        );
      }
    }
  }

  return diagnostics;
}
