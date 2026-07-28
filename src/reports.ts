import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { hasErrors } from "./diagnostics.js";
import { asString, isPlainObject } from "./io.js";
import { diagnosticsFor, type KernelAnalysis } from "./kernel.js";
import { schemaCoverage } from "./schema-validator.js";

interface IntegrityReport {
  generated_by: "architecture-knowledge-validation-kernel";
  report: string;
  items: unknown[];
  summary: Record<string, unknown>;
}

export interface ReportCheck {
  path: string;
  status: "current" | "missing" | "stale";
}

export function buildIntegrityReports(analysis: KernelAnalysis): Map<string, IntegrityReport> {
  const reports = new Map<string, IntegrityReport>();
  addReport(reports, "duplicate-ids", analysis.identity.duplicateIds, {
    duplicate_count: analysis.identity.duplicateIds.length,
  });
  addReport(reports, "duplicate-keys", analysis.identity.duplicateKeys, {
    duplicate_count: analysis.identity.duplicateKeys.length,
  });
  addReport(reports, "unresolved-references", analysis.identity.unresolvedReferences, {
    unresolved_count: analysis.identity.unresolvedReferences.length,
    checked_reference_count: analysis.identity.references.length,
  });
  addReport(reports, "orphan-records", analysis.relationships.orphanRecords, {
    orphan_count: analysis.relationships.orphanRecords.length,
    concept_count: analysis.model.concepts.length,
  });
  addReport(reports, "relationship-cycles", analysis.relationships.cycles, {
    cycle_count: analysis.relationships.cycles.length,
    forbidden_count: analysis.relationships.cycles.filter((cycle) => cycle.policy === "forbidden")
      .length,
    report_only_count: analysis.relationships.cycles.filter(
      (cycle) => cycle.policy === "report-only",
    ).length,
  });
  addReport(reports, "source-usage", analysis.evidence.sourceUsage, {
    source_count: analysis.model.sources.length,
    used_source_count: analysis.evidence.sourceUsage.filter((item) => item.claim_ids.length > 0)
      .length,
  });
  addReport(reports, "deprecated-source-usage", analysis.evidence.deprecatedUsage, {
    usage_count: analysis.evidence.deprecatedUsage.length,
  });
  addReport(
    reports,
    "lifecycle-distribution",
    Object.entries(analysis.lifecycle.distribution).map(([state, count]) => ({
      state,
      count,
    })),
    { record_count: analysis.model.records.length },
  );
  const ontology = ontologyCoverage(analysis);
  addReport(reports, "ontology-vocabulary-coverage", ontology.items, ontology.summary);
  const coverage = schemaCoverage(analysis.model, analysis.schema);
  addReport(reports, "schema-coverage", coverage.mapped_files, {
    governed_files: coverage.governed_files,
    validated_files: coverage.validated_files,
    schema_files: coverage.schema_files,
  });
  addReport(reports, "markdown-link-integrity", analysis.links.links, {
    checked_link_count: analysis.links.links.length,
    broken_link_count: analysis.links.links.filter((link) => link.status === "broken").length,
    markdown_file_count: analysis.model.markdownFiles.length,
  });
  const diagnostics = diagnosticsFor(analysis);
  addReport(
    reports,
    "summary",
    diagnostics.map((item) => ({
      code: item.code,
      severity: item.severity,
      path: item.path,
      ...(item.pointer ? { pointer: item.pointer } : {}),
      message: item.message,
    })),
    {
      valid: !hasErrors(diagnostics),
      error_count: diagnostics.filter((item) => item.severity === "error").length,
      warning_count: diagnostics.filter((item) => item.severity === "warning").length,
      record_count: analysis.model.records.length,
    },
  );
  return reports;
}

export async function writeIntegrityReports(
  root: string,
  reports: ReadonlyMap<string, IntegrityReport>,
): Promise<string[]> {
  const directory = path.join(root, "generated", "integrity");
  await mkdir(directory, { recursive: true });
  const written: string[] = [];
  for (const [name, report] of reports) {
    const relative = `generated/integrity/${name}.json`;
    await writeFile(path.join(root, relative), serializeReport(report), "utf8");
    written.push(relative);
  }
  return written.sort();
}

export async function checkIntegrityReports(
  root: string,
  reports: ReadonlyMap<string, IntegrityReport>,
): Promise<ReportCheck[]> {
  const checks: ReportCheck[] = [];
  for (const [name, report] of reports) {
    const relative = `generated/integrity/${name}.json`;
    let status: ReportCheck["status"] = "current";
    try {
      const current = await readFile(path.join(root, relative), "utf8");
      if (current !== serializeReport(report)) {
        status = "stale";
      }
    } catch {
      status = "missing";
    }
    checks.push({ path: relative, status });
  }
  return checks.sort((left, right) => left.path.localeCompare(right.path));
}

function addReport(
  reports: Map<string, IntegrityReport>,
  name: string,
  items: unknown[],
  summary: Record<string, unknown>,
): void {
  reports.set(name, {
    generated_by: "architecture-knowledge-validation-kernel",
    report: name,
    items,
    summary,
  });
}

function serializeReport(report: IntegrityReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function ontologyCoverage(analysis: KernelAnalysis): {
  items: unknown[];
  summary: Record<string, unknown>;
} {
  const conceptTypeUsage = new Map<string, number>();
  const domainUsage = new Map<string, number>();
  const predicateUsage = new Map<string, number>();
  for (const concept of analysis.model.concepts) {
    increment(conceptTypeUsage, asString(concept.data.type));
    increment(domainUsage, asString(concept.data.domain));
  }
  for (const relationship of analysis.model.relationships) {
    increment(predicateUsage, asString(relationship.data.predicate));
  }
  const items = [
    ...analysis.model.ontology.conceptTypes.map((item) => ({
      vocabulary: "concept-type",
      key: asString(item.key) ?? "",
      assignable: item.assignable_primary === true,
      usage_count: conceptTypeUsage.get(asString(item.key) ?? "") ?? 0,
    })),
    ...analysis.model.ontology.relationshipTypes.map((item) => ({
      vocabulary: "relationship-predicate",
      key: asString(item.key) ?? "",
      usage_count: predicateUsage.get(asString(item.key) ?? "") ?? 0,
    })),
    ...analysis.model.ontology.domains.map((key) => ({
      vocabulary: "domain",
      key,
      usage_count: domainUsage.get(key) ?? 0,
    })),
  ].sort((left, right) => {
    const leftVocabulary = isPlainObject(left) ? (asString(left.vocabulary) ?? "") : "";
    const rightVocabulary = isPlainObject(right) ? (asString(right.vocabulary) ?? "") : "";
    const leftKey = isPlainObject(left) ? (asString(left.key) ?? "") : "";
    const rightKey = isPlainObject(right) ? (asString(right.key) ?? "") : "";
    return leftVocabulary.localeCompare(rightVocabulary) || leftKey.localeCompare(rightKey);
  });
  return {
    items,
    summary: {
      vocabulary_term_count: items.length,
      used_term_count: items.filter(
        (item) =>
          isPlainObject(item) && typeof item.usage_count === "number" && item.usage_count > 0,
      ).length,
    },
  };
}

function increment(map: Map<string, number>, key: string | undefined): void {
  if (key) {
    map.set(key, (map.get(key) ?? 0) + 1);
  }
}
