import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  root: resolve(import.meta.dirname, "../.."),
  test: {
    environment: "node",
    include: ["e2e/partial-sync/partial-sync.external.test.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 60 * 60 * 1000,
    hookTimeout: 60 * 60 * 1000,
  },
})
