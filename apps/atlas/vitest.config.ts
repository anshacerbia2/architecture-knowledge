import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "packages/application/src/**/*.ts",
        "packages/knowledge-adapter/src/**/*.ts",
        "apps/api/src/http-server.ts",
        "apps/api/src/config.ts",
      ],
      thresholds: { statements: 85, branches: 75, functions: 85, lines: 85 },
    },
  },
});
