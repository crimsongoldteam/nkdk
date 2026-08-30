import { beforeAll, describe, expect, it, vi } from "vitest"
import { createProjectValidationWorkerSchemaCache } from "./projectValidationWorkerSchemaCache"
import { registeredProjectValidationFormRules } from "./projectValidationFormRules"
import { getConfigurationMetadataProjectSpec } from "../projectDefinition/specs"
import { MetadataBusinessProcessTabularSectionRules } from "../appliedObjects/metadataBusinessProcess/childRules"

const context = {
  version: "2.20",
  languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
  exportToYAML: { toTyped: false },
} as const

it("не компилирует заранее схемы, которые worker может не использовать", async () => {
  const compileAll = vi.fn()
  const cache = { compileAll } as never

  expect(await createProjectValidationWorkerSchemaCache({ context }, { createCache: () => cache })).toBe(cache)
  expect(compileAll).not.toHaveBeenCalled()
})

describe("projectValidationWorkerSchemaCache", () => {
  let acceptsConfigurationNameOnly: boolean
  let rejectsNonObjectForm: boolean
  let acceptsExplicitStandardAttributes: boolean

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
    acceptsExplicitStandardAttributes = cache
      .properties(MetadataBusinessProcessTabularSectionRules)
      .Check({ СтандартныеРеквизиты: "!xml/present" })
  })

  it("компилирует runtime cache независимо от расположения worker", () => {
    expect(acceptsConfigurationNameOnly).toBe(false)
    expect(rejectsNonObjectForm).toBe(false)
    expect(acceptsExplicitStandardAttributes).toBe(false)
  })
})
