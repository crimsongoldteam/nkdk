import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import { MetadataTabularSectionRules } from "./rules"

describe("MetadataTabularSection JSON Schema", () => {
  const compiled = () =>
    compileValidationSchema(
      exportMetadataItemToJSONSchema({
        context: mockContext,
        rule: MetadataTabularSectionRules,
      })
    )

  it("accepts a tabular section without attributes", () => {
    expect(compiled().Check({ ДлинаНомераСтроки: 9 })).toBe(true)
  })

  it("validates attributes when they are present", () => {
    expect(
      compiled().Check({
        Реквизиты: {
          ТестовыйРеквизит: { Тип: "Строка" },
        },
      })
    ).toBe(true)
    expect(compiled().Check({ Реквизиты: { ТестовыйРеквизит: "Строка" } })).toBe(false)
  })
})
