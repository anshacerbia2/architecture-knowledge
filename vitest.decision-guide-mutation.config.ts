import { defineConfig } from "vitest/config";
import base from "./vitest.config.js";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["tests/decision-guide.test.ts", "tests/m7-matrix-regressions.test.ts"],
  },
});
