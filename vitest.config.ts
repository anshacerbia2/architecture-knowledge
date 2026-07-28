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
        "src/lifecycle-validator.ts",
        "src/registry-consistency-validator.ts",
      ],
    },
  },
});
