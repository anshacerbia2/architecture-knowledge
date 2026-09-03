import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseDocument } from "yaml";

import { diagnostic, type Diagnostic } from "./diagnostics.js";

export interface ParsedData {
  data: unknown;
  diagnostics: Diagnostic[];
}

export interface MarkdownDocument {
  path: string;
  raw: string;
  body: string;
  frontMatter: unknown;
  headings: MarkdownHeading[];
  sections: Map<string, string>;
}

export interface MarkdownHeading {
  level: number;
  title: string;
  line: number;
}

const ignoredDirectories = new Set([".git", ".stryker-tmp", "node_modules", "coverage", ".tmp"]);

export function toPosix(value: string): string {
  return value.replaceAll("\\", "/");
}

export function relativePath(root: string, absolutePath: string): string {
  return toPosix(path.relative(root, absolutePath));
}

export async function walkFiles(root: string): Promise<string[]> {
  const output: string[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
        continue;
      }
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile()) {
        output.push(absolute);
      }
    }
  }

  await visit(root);
  return output;
}

export async function parseYamlFile(
  absolutePath: string,
  displayPath: string,
): Promise<ParsedData> {
  const raw = await readFile(absolutePath, "utf8");
  return parseYaml(raw, displayPath);
}

export function parseYaml(raw: string, displayPath: string): ParsedData {
  const document = parseDocument(raw, {
    merge: false,
    schema: "core",
    uniqueKeys: true,
  });
  const diagnostics: Diagnostic[] = [];
  for (const error of document.errors) {
    const line = error.linePos?.[0]?.line;
    const column = error.linePos?.[0]?.col;
    const pointer = line === undefined ? undefined : `:${line}:${column ?? 1}`;
    diagnostics.push(diagnostic("SCHEMA_YAML_PARSE", "error", displayPath, error.message, pointer));
  }
  for (const warning of document.warnings) {
    diagnostics.push(diagnostic("SCHEMA_YAML_WARNING", "warning", displayPath, warning.message));
  }
  if (diagnostics.some((item) => item.severity === "error")) {
    return { data: undefined, diagnostics };
  }
  return { data: document.toJS({ mapAsMap: false }), diagnostics };
}

export async function parseJsonFile(
  absolutePath: string,
  displayPath: string,
): Promise<ParsedData> {
  const raw = await readFile(absolutePath, "utf8");
  try {
    return { data: JSON.parse(raw) as unknown, diagnostics: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      data: undefined,
      diagnostics: [diagnostic("SCHEMA_JSON_PARSE", "error", displayPath, message)],
    };
  }
}

export async function parseMarkdownFile(
  absolutePath: string,
  displayPath: string,
): Promise<{ document?: MarkdownDocument; diagnostics: Diagnostic[] }> {
  const raw = await readFile(absolutePath, "utf8");
  let frontMatter: unknown;
  let body = raw;
  const diagnostics: Diagnostic[] = [];

  if (raw.startsWith("---\n") || raw.startsWith("---\r\n")) {
    const normalized = raw.replaceAll("\r\n", "\n");
    const end = normalized.indexOf("\n---\n", 4);
    if (end < 0) {
      diagnostics.push(
        diagnostic(
          "MARKDOWN_FRONT_MATTER_UNCLOSED",
          "error",
          displayPath,
          "YAML front matter starts with '---' but has no closing delimiter.",
        ),
      );
    } else {
      const parsed = parseYaml(normalized.slice(4, end), displayPath);
      diagnostics.push(...parsed.diagnostics);
      frontMatter = parsed.data;
      body = normalized.slice(end + 5);
    }
  }

  const headings = extractHeadings(body);
  return {
    document: {
      path: displayPath,
      raw,
      body,
      frontMatter,
      headings,
      sections: extractSections(body, headings),
    },
    diagnostics,
  };
}

function extractHeadings(body: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const lines = body.replaceAll("\r\n", "\n").split("\n");
  let inFence = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) {
      headings.push({
        level: match[1]?.length ?? 0,
        title: match[2]?.trim() ?? "",
        line: index + 1,
      });
    }
  }
  return headings;
}

function extractSections(body: string, headings: readonly MarkdownHeading[]): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = body.replaceAll("\r\n", "\n").split("\n");
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    if (!heading || heading.level !== 2) {
      continue;
    }
    const next = headings.slice(index + 1).find((candidate) => candidate.level <= heading.level);
    const end = next ? next.line - 1 : lines.length;
    sections.set(heading.title, lines.slice(heading.line, end).join("\n").trim());
  }
  return sections;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asStringArray(value: unknown): string[] {
  return asArray(value).filter((item): item is string => typeof item === "string");
}
