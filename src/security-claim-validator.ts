import { asArray, asString, asStringArray, isPlainObject } from "./io.js";
import { diagnostic, type Diagnostic } from "./diagnostics.js";
import type { RecordEntry, RepositoryModel } from "./model.js";

const normativeLanguage = /\b(MUST(?: NOT)?|SHOULD(?: NOT)?|RECOMMENDED|MAY)\b/;

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

    for (const implication of implications) {
      if (typeof implication === "string") {
        if (normativeLanguage.test(implication)) {
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

        const sourceLocations = asArray(claim.data.source_locations).filter(isPlainObject);
        for (const sourceId of asStringArray(claim.data.sources)) {
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
        }

        if (
          kind === "normative-control" &&
          (normalized(statement) !== normalized(asString(claim.data.statement)) ||
            !isPlainObject(claim.data.normative))
        ) {
          diagnostics.push(
            diagnostic(
              "SECURITY_NORMATIVE_SCOPE",
              "error",
              concept.path,
              `Normative implication must exactly preserve the statement and force model of claim '${claimId}'.`,
            ),
          );
        }
      }
    }
  }

  return diagnostics;
}
