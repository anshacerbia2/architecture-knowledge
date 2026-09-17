import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";
import { createRequire } from "node:module";

it("resolves the public kernel to compiled JS and rejects private package paths", () => {
  const require = createRequire(import.meta.url);
  expect(import.meta.resolve("architecture-knowledge-system/runtime")).toMatch(
    /\/dist\/runtime-api\.js$/,
  );
  for (const dependency of [
    "architecture-knowledge-system/src/rag-engine.js",
    "architecture-knowledge-system/dist/rag-engine.js",
  ])
    expect(() => require.resolve(dependency)).toThrow(/not defined by "exports"/);
});

async function files(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? files(path.join(root, e.name))
          : Promise.resolve(/\.tsx?$/.test(e.name) ? [path.join(root, e.name)] : []),
      ),
    )
  ).flat();
}
function permitted(file: string, dependency: string): boolean {
  const p = file.replaceAll("\\", "/");
  const resolved = dependency.startsWith(".")
    ? path.resolve(path.dirname(file), dependency).replaceAll("\\", "/")
    : dependency;
  if (dependency.startsWith("architecture-knowledge-system"))
    return (
      dependency === "architecture-knowledge-system/runtime" &&
      p.includes("packages/knowledge-adapter/")
    );
  const kernelRoot = path.resolve("../..").replaceAll("\\", "/");
  if (
    resolved.startsWith(`${kernelRoot}/src/`) ||
    resolved.startsWith(`${kernelRoot}/dist/`) ||
    resolved.includes("architecture-knowledge/src")
  )
    return false;
  if (p.includes("packages/contracts/")) return false;
  if (p.includes("packages/application/"))
    return resolved.includes("packages/application/") || resolved.includes("packages/contracts/");
  if (p.includes("apps/web/src/"))
    return (
      !resolved.includes("apps/api/") &&
      !resolved.includes("packages/application/") &&
      !resolved.includes("packages/knowledge-adapter/") &&
      !dependency.startsWith("node:")
    );
  return true;
}
it("enforces inward dependencies and a single kernel import boundary", async () => {
  const violations: string[] = [];
  for (const file of [...(await files("apps")), ...(await files("packages"))]) {
    const tree = ts.createSourceFile(
      file,
      await readFile(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = (node: ts.Node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        if (!permitted(file, node.moduleSpecifier.text))
          violations.push(`${file}: ${node.moduleSpecifier.text}`);
      }
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          node.expression.getText(tree) === "require")
      ) {
        const argument = node.arguments[0];
        if (!argument || !ts.isStringLiteral(argument) || !permitted(file, argument.text))
          violations.push(`${file}: dynamic dependency`);
      }
      ts.forEachChild(node, visit);
    };
    visit(tree);
  }
  expect(violations).toEqual([]);
});
it("detects representative forbidden dependency regressions", () => {
  expect(permitted("apps/web/src/page.ts", "architecture-knowledge-system/runtime")).toBe(false);
  expect(permitted("packages/application/src/a.ts", "architecture-knowledge-system/runtime")).toBe(
    false,
  );
  expect(
    permitted(
      "packages/knowledge-adapter/src/a.ts",
      "architecture-knowledge-system/src/rag-engine.js",
    ),
  ).toBe(false);
  expect(permitted("packages/knowledge-adapter/src/a.ts", "../../../../../src/rag-engine.js")).toBe(
    false,
  );
  expect(
    permitted("packages/knowledge-adapter/src/a.ts", "architecture-knowledge-system/runtime"),
  ).toBe(true);
  expect(
    permitted("apps/web/src/page.ts", "../../../packages/knowledge-adapter/src/kernel-adapter.js"),
  ).toBe(false);
  expect(permitted("packages/application/src/use-case.ts", "../../../apps/api/src/main.js")).toBe(
    false,
  );
  expect(permitted("packages/contracts/src/index.ts", "node:fs")).toBe(false);
  expect(
    permitted(
      "packages/knowledge-adapter/src/a.ts",
      "../../../../architecture-knowledge/src/rag-cli.js",
    ),
  ).toBe(false);
});
