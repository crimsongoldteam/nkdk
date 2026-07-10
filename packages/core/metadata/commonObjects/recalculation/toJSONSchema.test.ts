import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { mockContext } from "../../../tests/mockContext"

const compileSchema = () => {
  const exportToJSONSchema = getTypeRule("Recalculations", "exportToJSONSchema")
  expect(exportToJSONSchema).toBeDefined()
  if (exportToJSONSchema === undefined) throw new Error("Recalculations JSON schema export is not registered")
  const schema = exportToJSONSchema({
    context: mockContext,
    rule: { type: "Recalculations", yaml: "Перерасчеты" },
    value: undefined,
  })
  if (schema === undefined) throw new Error("Recalculations JSON schema export returned undefined")

  return compileValidationSchema(schema)
}

describe("Recalculations exportToJSONSchema", () => {
  it("accepts empty recalculation items", () => {
    const schema = compileSchema()

    expect(
      schema.Check({
        ПерерасчетВсеСвойства: {},
        ПерерасчетПоУмолчанию: {},
      })
    ).toBe(true)
  })

  it("rejects unknown recalculation item properties", () => {
    const schema = compileSchema()

    expect(
      schema.Check({
        ПерерасчетВсеСвойства: {
          НеизвестноеПоле: "значение",
        },
      })
    ).toBe(false)
  })
})
