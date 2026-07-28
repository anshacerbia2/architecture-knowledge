import { asArray, asString, asStringArray, isPlainObject } from "./io.js";
import { diagnostic, type Diagnostic } from "./diagnostics.js";
import type { RepositoryModel } from "./model.js";

export interface EvidenceAnalysis {
  sourceDiagnostics: Diagnostic[];
  claimDiagnostics: Diagnostic[];
  sourceUsage: { source_id: string; claim_ids: string[]; status: string }[];
  deprecatedUsage: { source_id: string; claim_id: string; status: string }[];
}

export function validateEvidence(model: RepositoryModel): EvidenceAnalysis {
  const sourceDiagnostics: Diagnostic[] = [];
  const claimDiagnostics: Diagnostic[] = [];
  const sourceById = new Map(model.sources.map((source) => [source.id, source]));
  const claimTypeByKey = new Map(
    model.ontology.claimTypes
      .map((item) => [asString(item.key), item] as const)
      .filter((entry): entry is readonly [string, Record<string, unknown>] => Boolean(entry[0])),
  );
  const usage = new Map<string, Set<string>>();
  const deprecatedUsage: EvidenceAnalysis["deprecatedUsage"] = [];

  for (const source of model.sources) {
    const status = asString(source.data.status);
    const quality = isPlainObject(source.data.quality) ? source.data.quality : {};
    if (
      (status === "approved" || status === "restricted") &&
      Object.entries(quality).some(
        ([key, value]) => key !== "assessment_notes" && value === "unassessed",
      )
    ) {
      sourceDiagnostics.push(
        diagnostic(
          "SOURCE_ADMITTED_UNASSESSED",
          "error",
          source.path,
          `Source '${source.id}' is admitted but has unassessed quality dimensions.`,
        ),
      );
    }
    if (
      status === "restricted" &&
      (asString(source.data.license_or_usage_notes)?.trim().length ?? 0) === 0
    ) {
      sourceDiagnostics.push(
        diagnostic(
          "SOURCE_RESTRICTED_NOTES",
          "error",
          source.path,
          `Restricted source '${source.id}' requires license or usage notes.`,
        ),
      );
    }
    if (status === "superseded" && !asString(source.data.superseded_by)) {
      sourceDiagnostics.push(
        diagnostic(
          "SOURCE_REPLACEMENT_REQUIRED",
          "error",
          source.path,
          `Superseded source '${source.id}' must identify its replacement.`,
        ),
      );
    }
  }

  for (const claim of model.claims) {
    const claimType = asString(claim.data.claim_type);
    const rule = claimType ? claimTypeByKey.get(claimType) : undefined;
    if (!rule) {
      claimDiagnostics.push(
        diagnostic(
          "CLAIM_TYPE_UNKNOWN",
          "error",
          claim.path,
          `Claim type '${claimType ?? "missing"}' is not registered.`,
        ),
      );
      continue;
    }
    const sourceIds = asStringArray(claim.data.sources);
    const derivedIds = asStringArray(claim.data.derived_from_claims);
    const evidenceRequired = rule.evidence_required === true;
    if (evidenceRequired && sourceIds.length === 0 && derivedIds.length === 0) {
      claimDiagnostics.push(
        diagnostic(
          "CLAIM_EVIDENCE_REQUIRED",
          "error",
          claim.path,
          `Claim '${claim.id}' requires registered source or claim evidence.`,
        ),
      );
    }
    if (
      (claimType === "direct-source-claim" || claimType === "normalized-source-claim") &&
      sourceIds.length === 0
    ) {
      claimDiagnostics.push(
        diagnostic(
          "CLAIM_DIRECT_SOURCE_REQUIRED",
          "error",
          claim.path,
          `Claim type '${claimType}' requires at least one source.`,
        ),
      );
    }
    if (
      (claimType === "direct-source-claim" || claimType === "normalized-source-claim") &&
      derivedIds.length > 0
    ) {
      claimDiagnostics.push(
        diagnostic(
          "CLAIM_DIRECT_DERIVATION",
          "error",
          claim.path,
          `Claim type '${claimType}' cannot masquerade as direct while deriving from other claims.`,
        ),
      );
    }
    if (rule.conditions_required === true && asArray(claim.data.conditions).length === 0) {
      claimDiagnostics.push(
        diagnostic(
          "CLAIM_CONDITIONS_REQUIRED",
          "error",
          claim.path,
          `Claim type '${claimType}' requires structured conditions.`,
        ),
      );
    }

    for (const sourceId of sourceIds) {
      const source = sourceById.get(sourceId);
      if (!source) {
        continue;
      }
      const claims = usage.get(sourceId) ?? new Set<string>();
      claims.add(claim.id);
      usage.set(sourceId, claims);
      const status = asString(source.data.status) ?? "unknown";
      if (status === "rejected" || status === "candidate") {
        claimDiagnostics.push(
          diagnostic(
            "CLAIM_SOURCE_NOT_ADMITTED",
            "error",
            claim.path,
            `Source '${sourceId}' has status '${status}' and cannot support claim '${claim.id}'.`,
          ),
        );
      } else if (status === "deprecated" || status === "superseded") {
        claimDiagnostics.push(
          diagnostic(
            "CLAIM_SOURCE_STALE",
            "warning",
            claim.path,
            `Claim '${claim.id}' uses ${status} source '${sourceId}'.`,
          ),
        );
        deprecatedUsage.push({ source_id: sourceId, claim_id: claim.id, status });
      }
    }
  }

  const sourceUsage = model.sources
    .map((source) => ({
      source_id: source.id,
      claim_ids: [...(usage.get(source.id) ?? [])].sort(),
      status: asString(source.data.status) ?? "unknown",
    }))
    .sort((left, right) => left.source_id.localeCompare(right.source_id));

  return { sourceDiagnostics, claimDiagnostics, sourceUsage, deprecatedUsage };
}
