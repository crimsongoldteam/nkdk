import type { TSchema } from "typebox"
import { beforeAll,describe,expect,it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { getTypeRule } from "../../ruleRuntime"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { ClientApplicationFormRules } from "./rules"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"


let usePurposesSchema: ReturnType<typeof compileValidationSchema>
let ordinaryFormConstraint: ReturnType<typeof compileValidationSchema>

describe("ClientApplicationForm exportToJSONSchema type rule", () => {
  beforeAll(() => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: ClientApplicationFormRules.properties.usePurposes,
      value: undefined,
    })
    if (schema === undefined) throw new Error("UsePurposes schema is not registered")
    usePurposesSchema = compileValidationSchema(schema)

    const formSchema = exportClientApplicationFormToJSONSchema({
      context: mockContext,
      rule: { type: "ClientApplicationForm" },
      value: undefined,
    }) as { allOf?: TSchema[] }
    const ordinaryFormSchema = formSchema.allOf?.[1]
    if (ordinaryFormSchema === undefined) throw new Error("Ordinary form constraint is not registered")
    ordinaryFormConstraint = compileValidationSchema(ordinaryFormSchema)
  })

  it("registers client form JSON Schema exporter", () => {
    const exportToJSONSchema = getTypeRule("ClientApplicationForm", "exportToJSONSchema")
    expect(exportToJSONSchema).toBe(exportClientApplicationFormToJSONSchema)
  })

  it.each([
    ["МобильноеПриложение", true],
    ["ПлатформаИМобильноеПриложение", true],
    ["Произвольное", false],
  ])("validates use purpose %s", (yaml, expected) => {
    expect(usePurposesSchema.Check(yaml)).toBe(expected)
  })

  it("разрешает обычную форму без тела", () => {
    expect(ordinaryFormConstraint.Check({ ТипФормы: "Обычная" })).toBe(true)
  })

  it.each([
    ["Элементы", { Поле: { Вид: "ПолеВвода" } }],
    ["Реквизиты", { Значение: { Тип: "Строка" } }],
  ])("запрещает свойство тела %s у обычной формы", (property, value) => {
    expect(ordinaryFormConstraint.Check({ ТипФормы: "Обычная", [property]: value })).toBe(false)
  })

  it("разрешает свойства тела у управляемой формы", () => {
    expect(ordinaryFormConstraint.Check({ Ширина: 100 })).toBe(true)
  })
})
