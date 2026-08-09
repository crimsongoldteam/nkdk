import { beforeAll, describe, expect, it } from "vitest"

import { mockContext } from "../../../../tests/mockContext"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import { exportPropertyToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"

import "./rules"

let schema: ReturnType<typeof compileValidationSchema>

describe("FormAttributeAdditionalColumns exportToJSONSchema", () => {
  beforeAll(() => {
    const jsonSchema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "FormAttributeAdditionalColumns", yaml: "ДополнительныеКолонки" },
      value: undefined,
    })
    if (jsonSchema === undefined) throw new Error("FormAttributeAdditionalColumns schema is not registered")
    schema = compileValidationSchema(jsonSchema, { eagerFallback: true })
  })

  it("accepts an empty additional-column group", () => {
    expect(schema.Check({ "Список.Пустая": {} })).toBe(true)
  })

  it("rejects unsupported fields inside an additional-column group", () => {
    expect(schema.Check({ "Список.Пустая": { Лишнее: true } })).toBe(false)
  })
})
