import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { configDefaults } from "vitest/config"
import { defineConfig } from "vitest/config"

interface UnitIntegrationTestOptions {
  environment?: string
  globals?: boolean
  testTimeout?: number
  watch?: boolean
}

export function unitIntegrationVitestConfig(
  configUrl: string,
  testOptions: UnitIntegrationTestOptions = {},
) {
  const packageDirectory = dirname(fileURLToPath(configUrl))
  const unitDependencyGuard = resolve(packageDirectory, "../../scripts/vitest/forbid-unit-external-dependencies")
  return defineConfig({
    test: {
      ...testOptions,
      projects: unitIntegrationProjects(unitDependencyGuard),
    },
  })
}

function unitIntegrationProjects(unitDependencyGuard: string) {
  return [
    {
      test: {
        name: "unit",
        exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
        setupFiles: [unitDependencyGuard],
      },
    },
    {
      test: {
        name: "integration",
        include: ["**/*.integration.test.ts"],
      },
    },
  ]
}
