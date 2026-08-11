import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  root: resolve(import.meta.dirname, ".."),
  test: {
    environment: "node",
    include: ["e2e/**/*.test.ts"],
    exclude: ["e2e/fixtures/**"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 600_000,
    hookTimeout: 600_000,
  },
})
