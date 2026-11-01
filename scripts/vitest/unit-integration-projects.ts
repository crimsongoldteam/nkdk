import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { configDefaults } from "vitest/config"
import { defineConfig, type TestUserConfig } from "vitest/config"

interface UnitIntegrationTestOptions {
  environment?: string
  globals?: boolean
  testTimeout?: number
  watch?: boolean
}

export function unitIntegrationVitestConfig(
  configUrl: string,
  testOptions: UnitIntegrationTestOptions = {},
  unitTestOptions: Pick<TestUserConfig, "pool" | "vmMemoryLimit"> = {},
) {
  const packageDirectory = dirname(fileURLToPath(configUrl))
  const unitDependencyGuard = resolve(packageDirectory, "../../scripts/vitest/forbid-unit-external-dependencies")
  return defineConfig({
    test: {
      maxWorkers: 1,
      ...testOptions,
      projects: unitIntegrationProjects(unitDependencyGuard, unitTestOptions),
    },
  })
}

function unitIntegrationProjects(
  unitDependencyGuard: string,
  unitTestOptions: Pick<TestUserConfig, "pool" | "vmMemoryLimit">,
) {
  return [
    {
      test: {
        name: "unit",
        ...unitTestOptions,
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
