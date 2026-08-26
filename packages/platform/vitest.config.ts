import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const __dirname = dirname(fileURLToPath(import.meta.url))
const unitDependencyGuard = resolve(__dirname, "../../scripts/vitest/forbid-unit-external-dependencies")

export default defineConfig({
  test: {
    environment: "node",
    maxWorkers: 1,
    setupFiles: [unitDependencyGuard],
    watch: false,
  },
})
