import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { beforeAll, describe, expect, it } from "vitest"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import { MetadataCatalogTabularSectionRules } from "../../appliedObjects/metadataCatalog/childRules"

describe("MetadataTabularSection JSON Schema", () => {
  let compiled: ReturnType<typeof compileValidationSchema>

  beforeAll(() => {
    compiled = compileValidationSchema(
      exportMetadataItemToJSONSchema({
        context: mockContext,
        rule: MetadataCatalogTabularSectionRules,
      })
    )
    compiled.Check(undefined)
  })

  it("accepts a tabular section without attributes", () => {
    expect(compiled.Check({ ДлинаНомераСтроки: 9 })).toBe(true)
  })

  it("validates attributes when they are present", () => {
    expect(
      compiled.Check({
        Реквизиты: {
          ТестовыйРеквизит: { Тип: "Строка" },
        },
      })
    ).toBe(true)
    expect(compiled.Check({ Реквизиты: { ТестовыйРеквизит: "Строка" } })).toBe(false)
  })
})
