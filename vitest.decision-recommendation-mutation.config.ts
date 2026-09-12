import { defineConfig } from "vitest/config";
import base from "./vitest.config.js";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: [
      "tests/m7-output-regressions.test.ts",
      "tests/m7-decision-basis-regressions.test.ts",
      "tests/m7-preflight-regressions.test.ts",
      "tests/m7-2-output-coverage.test.ts",
    ],
  },
});
