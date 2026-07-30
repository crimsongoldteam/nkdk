import { beforeAll, describe, expect, it } from "vitest"
import { createProjectValidationWorkerSchemaCache } from "./projectValidationWorkerSchemaCache"
import { configurationValidationProjectSpec } from "./projectSpecs"

const context = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
} as const

describe("projectValidationWorkerSchemaCache", () => {
  let acceptsConfigurationNameOnly: boolean

  beforeAll(async () => {
    const cache = await createProjectValidationWorkerSchemaCache({
      context,
      workerUrl: "file:///project/metadata/validation/projectValidationWorker.ts",
    })
    acceptsConfigurationNameOnly = cache
      .properties(configurationValidationProjectSpec.rule)
      .Check({ Имя: "Конфигурация" })
  })

  it("uses runtime schema cache for source TypeScript workers", () => {
    expect(acceptsConfigurationNameOnly).toBe(false)
  })
})
