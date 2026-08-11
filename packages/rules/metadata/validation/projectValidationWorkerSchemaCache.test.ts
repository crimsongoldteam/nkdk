import { beforeAll, describe, expect, it } from "vitest"
import { createProjectValidationWorkerSchemaCache } from "./projectValidationWorkerSchemaCache"
import { registeredProjectValidationFormRules } from "./projectValidationFormRules"
import { getConfigurationMetadataProjectSpec } from "../projectDefinition/specs"

const context = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
} as const

describe("projectValidationWorkerSchemaCache", () => {
  let acceptsConfigurationNameOnly: boolean
  let rejectsNonObjectForm: boolean

  beforeAll(async () => {
    const workerParams = {
      context,
      workerUrl: "file:///missing/compiled/worker.js",
    }
    const cache = await createProjectValidationWorkerSchemaCache(workerParams)
    acceptsConfigurationNameOnly = cache
      .properties(getConfigurationMetadataProjectSpec().rule)
      .Check({ Имя: "Конфигурация" })
    rejectsNonObjectForm = cache.form(registeredProjectValidationFormRules()[0]!.rule).Check(42)
  })

  it("компилирует runtime cache независимо от расположения worker", () => {
    expect(acceptsConfigurationNameOnly).toBe(false)
    expect(rejectsNonObjectForm).toBe(false)
  })
})
