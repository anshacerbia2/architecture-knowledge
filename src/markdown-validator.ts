import { stat } from "node:fs/promises";
import path from "node:path";

import { asArray, asString, asStringArray, isPlainObject, toPosix } from "./io.js";
import { diagnostic, type Diagnostic } from "./diagnostics.js";
import type { MarkdownHeading } from "./io.js";
import type { RepositoryModel } from "./model.js";
import { validateSecurityClaimBindings } from "./security-claim-validator.js";

const requiredSections = [
  "Summary",
  "Intent",
  "Context",
  "Problem",
  "Forces",
  "How It Works",
  "Structural View",
  "Runtime View",
  "Applicability",
  "When Not to Use It",
  "Quality Attribute Impact",
  "Benefits",
  "Trade-offs",
  "Risks and Failure Modes",
  "Security Implications",
  "Data Implications",
  "Operational Implications",
  "Implementation Variants",
  "Alternatives",
  "Decision Guide",
  "Verification and Testing",
  "Examples",
  "Counterexamples",
  "Related Concepts",
  "Claims and Evidence",
  "Sources",
] as const;

const structuredProjectionSections = new Map([
  ["risks", "Risks and Failure Modes"],
  ["alternatives", "Alternatives"],
  ["examples", "Examples"],
  ["counterexamples", "Counterexamples"],
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

export interface LinkResult {
  path: string;
  target: string;
  status: "valid" | "broken";
  reason?: string;
}

export interface MarkdownAnalysis {
  diagnostics: Diagnostic[];
  checkedKnowledgeUnits: number;
}

export interface LinkAnalysis {
  diagnostics: Diagnostic[];
  links: LinkResult[];
}

export function validateMarkdown(model: RepositoryModel): MarkdownAnalysis {
  const diagnostics: Diagnostic[] = [];
  const ids = new Set(model.records.map((record) => record.id));
  const markdownPolicy = isPlainObject(model.ontology.validationPolicies.markdown)
    ? model.ontology.validationPolicies.markdown
    : {};
  const failureSensitive = new Set(asStringArray(markdownPolicy.failure_sensitive_types));
  const securitySensitiveTypes = new Set(asStringArray(markdownPolicy.security_sensitive_types));
  const securitySensitiveDomains = new Set(
    asStringArray(markdownPolicy.security_sensitive_domains),
  );
  const structuredMetadataFields = asStringArray(markdownPolicy.structured_metadata_fields);
  const placeholderPatterns = asStringArray(markdownPolicy.placeholder_patterns).map(
    (item) => new RegExp(item, "iu"),
  );
  const absoluteTerms = asStringArray(markdownPolicy.absolute_terms);
  const qualifiers = asStringArray(markdownPolicy.contextual_qualifiers);

  for (const concept of model.concepts.filter((record) => record.markdown)) {
    const document = concept.markdown;
    if (!document) continue;
    const type = asString(concept.data.type) ?? "";
    const domain = asString(concept.data.domain) ?? "";
    const title = asString(concept.data.title);
    if (document.frontMatter === undefined) {
      diagnostics.push(
        diagnostic(
          "MARKDOWN_FRONT_MATTER_MISSING",
          "error",
          document.path,
          "Knowledge units require YAML front matter.",
        ),
      );
    }
    const h1 = document.headings.filter((heading) => heading.level === 1);
    if (h1.length !== 1) {
      diagnostics.push(
        diagnostic(
          "MARKDOWN_TITLE_COUNT",
          "error",
          document.path,
          `Knowledge unit requires exactly one level-one heading; found ${h1.length}.`,
        ),
      );
    } else if (title && h1[0]?.title !== title) {
      diagnostics.push(
        diagnostic(
          "MARKDOWN_TITLE_MISMATCH",
          "error",
          document.path,
          `Heading '${h1[0]?.title}' does not match front-matter title '${title}'.`,
        ),
      );
    }
    const duplicateHeadings = duplicates(
      document.headings.filter((heading) => heading.level === 2).map((heading) => heading.title),
    );
    for (const heading of duplicateHeadings) {
      diagnostics.push(
        diagnostic(
          "MARKDOWN_HEADING_DUPLICATE",
          "error",
          document.path,
          `Level-two heading '${heading}' is duplicated.`,
        ),
      );
    }
    for (const section of requiredSections) {
      if (!document.sections.has(section)) {
        diagnostics.push(
          diagnostic(
            "MARKDOWN_SECTION_MISSING",
            "error",
            document.path,
            `Required section '${section}' is missing.`,
          ),
        );
      } else {
        const body = document.sections.get(section)?.trim() ?? "";
        if (!body) {
          diagnostics.push(
            diagnostic(
              "MARKDOWN_SECTION_EMPTY",
              "error",
              document.path,
              `Required section '${section}' is empty.`,
            ),
          );
        } else if (/^(?:n\/a|not applicable)\s*[:.-]?\s*$/iu.test(body)) {
          diagnostics.push(
            diagnostic(
              "MARKDOWN_NOT_APPLICABLE_REASON",
              "error",
              document.path,
              `Section '${section}' is marked not applicable without a reason.`,
            ),
          );
        }
      }
    }
    for (const pattern of placeholderPatterns) {
      if (pattern.test(document.body)) {
        diagnostics.push(
          diagnostic(
            "MARKDOWN_PLACEHOLDER",
            "error",
            document.path,
            `Placeholder content matches ${pattern}.`,
          ),
        );
      }
    }
    for (const sentence of sentences(document.body)) {
      const lower = sentence.toLocaleLowerCase("en");
      const absolute = absoluteTerms.find((term) =>
        new RegExp(`\\b${escapeRegex(term)}\\b`, "u").test(lower),
      );
      if (absolute && !qualifiers.some((qualifier) => lower.includes(qualifier))) {
        diagnostics.push(
          diagnostic(
            "MARKDOWN_ABSOLUTE_RECOMMENDATION",
            "error",
            document.path,
            `Unqualified absolute term '${absolute}' appears in: '${truncate(sentence)}'.`,
          ),
        );
      }
    }
    if (asArray(concept.data.benefits).length > 0 && asArray(concept.data.tradeoffs).length === 0) {
      diagnostics.push(
        diagnostic(
          "MARKDOWN_BENEFIT_WITHOUT_TRADEOFF",
          "error",
          document.path,
          "A concept with benefits must record trade-offs.",
        ),
      );
    }
    for (const field of structuredMetadataFields) {
      if (asArray(concept.data[field]).length === 0) {
        diagnostics.push(
          diagnostic(
            "MARKDOWN_STRUCTURED_METADATA_REQUIRED",
            "error",
            document.path,
            `Structured metadata field '${field}' must preserve independently retrievable context.`,
          ),
        );
      }
      const projectedSection = structuredProjectionSections.get(field);
      if (projectedSection) {
        const sectionText = normalizeSemanticText(document.sections.get(projectedSection) ?? "");
        for (const item of asArray(concept.data[field]).filter(isPlainObject)) {
          const statement = asString(item.statement);
          if (statement && !sectionText.includes(normalizeSemanticText(statement))) {
            diagnostics.push(
              diagnostic(
                "MARKDOWN_STRUCTURED_PROJECTION_MISMATCH",
                "error",
                document.path,
                `Structured field '${field}' is not projected in Markdown section '${projectedSection}'.`,
              ),
            );
          }
        }
      }
    }
    if (
      /\bare governed related concepts\b/iu.test(document.sections.get("Related Concepts") ?? "")
    ) {
      diagnostics.push(
        diagnostic(
          "MARKDOWN_RELATED_CONCEPTS_BOILERPLATE",
          "error",
          document.path,
          "Related Concepts must explain the concept-specific semantic connection.",
        ),
      );
    }
    if (
      failureSensitive.has(type) &&
      (asArray(concept.data.failure_modes).length === 0 ||
        isNotApplicable(document.sections.get("Risks and Failure Modes") ?? ""))
    ) {
      diagnostics.push(
        diagnostic(
          "MARKDOWN_FAILURE_MODES_REQUIRED",
          "error",
          document.path,
          `Failure-sensitive concept type '${type}' requires failure-mode references and analysis.`,
        ),
      );
    }
    if (securitySensitiveTypes.has(type) || securitySensitiveDomains.has(domain)) {
      const securityText = [
        ...asStringArray(concept.data.security_implications),
        document.sections.get("Security Implications") ?? "",
      ].join(" ");
      if (!/threat assumptions?/iu.test(securityText)) {
        diagnostics.push(
          diagnostic(
            "MARKDOWN_THREAT_ASSUMPTIONS_REQUIRED",
            "error",
            document.path,
            "Security-sensitive knowledge requires explicit threat assumptions.",
          ),
        );
      }
    }
    const statusRank = lifecycleRank.get(asString(concept.data.status) ?? "") ?? -1;
    if (statusRank >= (lifecycleRank.get("drafted") ?? 3)) {
      if (asArray(concept.data.claims).length === 0) {
        diagnostics.push(
          diagnostic(
            "MARKDOWN_CLAIMS_REQUIRED",
            "error",
            document.path,
            "Drafted or later knowledge requires claim references.",
          ),
        );
      }
      if (asArray(concept.data.sources).length === 0) {
        diagnostics.push(
          diagnostic(
            "MARKDOWN_SOURCES_REQUIRED",
            "error",
            document.path,
            "Drafted or later knowledge requires source references.",
          ),
        );
      }
    }
    for (const match of document.body.matchAll(/\b(?:AKC|AKS|AKL|AKR|AKG)-[0-9]{6}\b/gu)) {
      if (!ids.has(match[0])) {
        diagnostics.push(
          diagnostic(
            "MARKDOWN_RECORD_REFERENCE",
            "error",
            document.path,
            `Markdown record reference '${match[0]}' does not resolve.`,
          ),
        );
      }
    }
  }

  diagnostics.push(...validateSecurityClaimBindings(model));

  return {
    diagnostics,
    checkedKnowledgeUnits: model.concepts.filter((record) => record.markdown).length,
  };
}

export async function validateLinks(model: RepositoryModel): Promise<LinkAnalysis> {
  const diagnostics: Diagnostic[] = [];
  const links: LinkResult[] = [];
  for (const document of model.markdownFiles) {
    for (const target of inlineLinks(document.body)) {
      if (
        target.startsWith("#") ||
        /^(?:https?:|mailto:|app:)/u.test(target) ||
        target.startsWith("data:")
      ) {
        if (target.startsWith("#")) {
          const anchor = target.slice(1);
          const valid = headingAnchors(document.headings).has(anchor);
          links.push({
            path: document.path,
            target,
            status: valid ? "valid" : "broken",
            ...(valid ? {} : { reason: "anchor not found" }),
          });
          if (!valid) {
            diagnostics.push(
              diagnostic(
                "LINK_ANCHOR_UNRESOLVED",
                "error",
                document.path,
                `Local anchor '${target}' does not resolve.`,
              ),
            );
          }
        }
        continue;
      }
      const [filePartRaw, anchor] = target.replace(/^<|>$/gu, "").split("#", 2);
      const filePart = decodeURIComponent(filePartRaw ?? "");
      const absolute = path.resolve(model.root, path.dirname(document.path), filePart);
      let valid = false;
      let reason = "target does not exist";
      try {
        const targetStat = await stat(absolute);
        valid = targetStat.isFile() || targetStat.isDirectory();
        if (valid && anchor && targetStat.isFile() && absolute.endsWith(".md")) {
          const relative = toPosix(path.relative(model.root, absolute));
          const targetDocument = model.markdownFiles.find((item) => item.path === relative);
          valid = Boolean(targetDocument && headingAnchors(targetDocument.headings).has(anchor));
          reason = "anchor not found";
        }
      } catch {
        valid = false;
      }
      links.push({
        path: document.path,
        target,
        status: valid ? "valid" : "broken",
        ...(valid ? {} : { reason }),
      });
      if (!valid) {
        diagnostics.push(
          diagnostic(
            "LINK_UNRESOLVED",
            "error",
            document.path,
            `Local link '${target}' does not resolve (${reason}).`,
          ),
        );
      }
    }
  }
  return {
    diagnostics,
    links: links.sort(
      (left, right) =>
        left.path.localeCompare(right.path) || left.target.localeCompare(right.target),
    ),
  };
}

function inlineLinks(body: string): string[] {
  return [...body.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+(?:\s+"[^"]*")?)\)/gu)]
    .map((match) => match[1]?.replace(/\s+"[^"]*"$/u, "") ?? "")
    .filter(Boolean);
}

function headingAnchors(headings: readonly MarkdownHeading[]): Set<string> {
  const counts = new Map<string, number>();
  const anchors = new Set<string>();
  for (const heading of headings) {
    const base = heading.title
      .toLocaleLowerCase("en")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/gu, "-");
    const count = counts.get(base) ?? 0;
    anchors.add(count === 0 ? base : `${base}-${count}`);
    counts.set(base, count + 1);
  }
  return anchors;
}

function duplicates(values: readonly string[]): string[] {
  return [
    ...new Set(values.filter((value) => values.indexOf(value) !== values.lastIndexOf(value))),
  ].sort();
}

function isNotApplicable(value: string): boolean {
  return /^(?:n\/a|not applicable)\b/iu.test(value.trim());
}

function sentences(body: string): string[] {
  return body
    .replace(/```[\s\S]*?```/gu, "")
    .split(/(?<=[.!?])\s+/u)
    .map((item) => item.replace(/^#+\s+/u, "").trim())
    .filter(Boolean);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function truncate(value: string): string {
  return value.length <= 120 ? value : `${value.slice(0, 117)}...`;
}

function normalizeSemanticText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
