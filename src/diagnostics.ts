export type Severity = "error" | "warning";

export interface Diagnostic {
  code: string;
  severity: Severity;
  path: string;
  message: string;
  pointer?: string;
}

export function diagnostic(
  code: string,
  severity: Severity,
  path: string,
  message: string,
  pointer?: string,
): Diagnostic {
  return pointer === undefined
    ? { code, severity, path, message }
    : { code, severity, path, message, pointer };
}

export function sortDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort(
    (left, right) =>
      left.severity.localeCompare(right.severity) ||
      left.path.localeCompare(right.path) ||
      (left.pointer ?? "").localeCompare(right.pointer ?? "") ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message),
  );
}

export function formatDiagnostic(item: Diagnostic): string {
  const location = item.pointer ? `${item.path}${item.pointer}` : item.path;
  return `${item.severity.toUpperCase()} ${item.code} ${location}: ${item.message}`;
}

export function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
  return diagnostics.some((item) => item.severity === "error");
}

export function summarizeDiagnostics(diagnostics: readonly Diagnostic[]): {
  errors: number;
  warnings: number;
} {
  return diagnostics.reduce(
    (summary, item) => {
      summary[item.severity === "error" ? "errors" : "warnings"] += 1;
      return summary;
    },
    { errors: 0, warnings: 0 },
  );
}
