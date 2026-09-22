import { defineConfig } from "vitest/config";
import base from "./vitest.config.js";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["tests/application.test.ts", "tests/http.test.ts", "tests/kernel-adapter.test.ts"],
  },
});
