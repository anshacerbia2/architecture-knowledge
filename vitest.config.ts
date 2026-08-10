import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 90,
        lines: 90,
      },
      include: [
        "src/id-validator.ts",
        "src/evidence-validator.ts",
        "src/claim-derivation-validator.ts",
        "src/relationship-validator.ts",
        "src/markdown-validator.ts",
        "src/security-claim-validator.ts",
        "src/lifecycle-validator.ts",
        "src/registry-consistency-validator.ts",
        "src/graph-projector.ts",
        "src/graph-query.ts",
        "src/graph-artifacts.ts",
        "src/retrieval-units.ts",
        "src/retrieval-query-contract.ts",
        "src/retrieval-query.ts",
        "src/embedding-provider.ts",
        "src/retrieval-evaluation.ts",
      ],
    },
  },
});
