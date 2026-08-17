import { compileValidationSchema } from "./../../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"
import "./toJSONSchema"

const context = {
  languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
  version: "2.20",
} as const

describe("AvailableFields JSON Schema", () => {
  it("accepts strings and object items", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "AvailableFields", yaml: "ДоступныеПоляОтбора" },
      value: undefined,
    })
    const compiled = compileValidationSchema(schema!)

    expect(compiled.Check(["Документ", { Поле: "Документ", Использование: "Ложь" }])).toBe(true)
  })

  it("rejects record-shaped values", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "AvailableFields", yaml: "ДоступныеПоляОтбора" },
      value: undefined,
    })
    const compiled = compileValidationSchema(schema!)

    expect(compiled.Check({ Документ: { Поле: "Документ" } })).toBe(false)
  })

  it("accepts non-empty !xml/reference only in the validation schema", () => {
    const validationSchema = exportPropertyToJSONSchema({
      context: {
        ...context,
        exportToJSONSchema: { mode: "inline", refs: new Set<string>(), explicitXMLValues: true },
      },
      rule: { type: "AvailableFields", yaml: "Поля" },
      value: undefined,
    })
    const externalSchema = exportPropertyToJSONSchema({
      context: {
        ...context,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule: { type: "AvailableFields", yaml: "Поля" },
      value: undefined,
    })
    const validation = compileValidationSchema(validationSchema!)
    const external = compileValidationSchema(externalSchema!)

    for (const value of [
      ["!xml/reference НеизвестныйЭлемент"],
      [{ Поле: "!xml/reference ДругойЭлемент", Использование: "Истина" }],
    ]) {
      expect(validation.Check(value)).toBe(true)
      expect(external.Check(value)).toBe(false)
    }
    expect(validation.Check(["!xml/reference"])).toBe(false)
    expect(validation.Check([{ Поле: "!xml/reference" }])).toBe(false)
  })
})
