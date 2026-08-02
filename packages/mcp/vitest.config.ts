import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 10_000,
    watch: false,
    runner: process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"] === undefined
      ? undefined
      : resolve(import.meta.dirname, "../core/scripts/test-file-lifecycle-runner.mjs"),
  },
})
