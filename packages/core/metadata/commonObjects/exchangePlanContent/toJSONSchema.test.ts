import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { ExchangePlanContentRules } from "./rules"

import "./register"

describe("ExchangePlanContent JSON Schema", () => {
  it("accepts compact content items without implicit Авторегистрация", () => {
    const schema = TypeCompiler.Compile(
      exportMetadataItemToJSONSchema({
        context: mockContext,
        rule: ExchangePlanContentRules,
      })
    )

    expect(schema.Check([{ Метаданные: "Документ.Заказ" }])).toBe(true)
    expect(schema.Check([{ Метаданные: "Документ.Заказ", Авторегистрация: "Запретить" }])).toBe(true)
    expect(schema.Check([{ Авторегистрация: "Запретить" }])).toBe(false)
  })
})
