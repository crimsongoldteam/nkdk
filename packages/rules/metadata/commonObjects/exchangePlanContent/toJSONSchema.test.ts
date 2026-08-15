import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { ExchangePlanContentRules } from "./rules"
import { XML_ABSENT_TAG_VALUE, XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

import "./register"

describe("ExchangePlanContent JSON Schema", () => {
  it("accepts compact content items without implicit Авторегистрация", () => {
    const schema = compileValidationSchema(
      exportMetadataItemToJSONSchema({
        context: mockContext,
        rule: ExchangePlanContentRules,
      })
    )

    expect(schema.Check([{ Метаданные: "Документ.Заказ" }])).toBe(true)
    expect(schema.Check([{ Метаданные: "Документ.Заказ", Авторегистрация: "Запретить" }])).toBe(true)
    expect(schema.Check([{ Авторегистрация: "Запретить" }])).toBe(false)
  })

  it("различает отсутствующий, пустой и непустой состав владельца", () => {
    const ownerRule = {
      itemType: "ExchangePlanContentOwnerSchemaProbe",
      properties: {
        content: {
          type: "ExchangePlanContent",
          yaml: "Состав",
          xml: "Content",
        },
      },
    } as const satisfies MetadataItemRule
    const schema = compileValidationSchema(exportMetadataItemToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set(),
          validationPropertyRefs: true,
        },
      },
      rule: ownerRule,
    }))

    expect(schema.Check({})).toBe(true)
    expect(schema.Check({ Состав: XML_PRESENT_TAG_VALUE })).toBe(true)
    expect(schema.Check({ Состав: [] })).toBe(false)
    expect(schema.Check({ Состав: "!xml/present payload" })).toBe(false)
    expect(schema.Check({ Состав: XML_ABSENT_TAG_VALUE })).toBe(false)
  })
})
