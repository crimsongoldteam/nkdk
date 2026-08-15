import { beforeAll, describe, expect, it } from "vitest"
import { getTypeRule } from "../../ruleRuntime"
import { exportPropertyToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { mockContext } from "../../../tests/mockContext"
import { ClientApplicationFormRules } from "./rules"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"


let usePurposesSchema: ReturnType<typeof compileValidationSchema>
let formSchema: ReturnType<typeof compileValidationSchema>

describe("ClientApplicationForm exportToJSONSchema type rule", () => {
  beforeAll(() => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: ClientApplicationFormRules.properties.usePurposes,
      value: undefined,
    })
    if (schema === undefined) throw new Error("UsePurposes schema is not registered")
    usePurposesSchema = compileValidationSchema(schema)
    const formRuleSchema = exportClientApplicationFormToJSONSchema({
      context: mockContext,
      rule: { type: "ClientApplicationForm" },
      value: undefined,
    })
    if (formRuleSchema === undefined) throw new Error("ClientApplicationForm schema is not registered")
    formSchema = compileValidationSchema(formRuleSchema)
  })

  it("registers client form JSON Schema exporter", () => {
    const exportToJSONSchema = getTypeRule("ClientApplicationForm", "exportToJSONSchema")
    expect(exportToJSONSchema).toBe(exportClientApplicationFormToJSONSchema)
  })

  it("показывает Имя встроенного элемента только внутренней схеме", () => {
    const exportToJSONSchema = getTypeRule("ContextMenu", "exportToJSONSchema")
    if (exportToJSONSchema === undefined) throw new Error("ContextMenu schema exporter is not registered")
    const internal = exportToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "inline", refs: new Set(), validationPropertyRefs: true },
      },
      rule: { type: "ContextMenu" },
      value: undefined,
    })
    const external = exportToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set() },
      },
      rule: { type: "ContextMenu" },
      value: undefined,
    })

    expect(JSON.stringify(internal)).toContain('"Имя"')
    expect(JSON.stringify(internal)).toContain("^!xml/name")
    expect(JSON.stringify(external)).not.toContain('"Имя"')
  })

  it.each([
    ["МобильноеПриложение", true],
    ["ПлатформаИМобильноеПриложение", true],
    ["Произвольное", false],
  ])("validates use purpose %s", (yaml, expected) => {
    expect(usePurposesSchema.Check(yaml)).toBe(expected)
  })

  it("разрешает обычную форму без тела", () => {
    expect(formSchema.Check({ ТипФормы: "Обычная" })).toBe(true)
  })

  it.each([
    ["Элементы", { Поле: { Вид: "ПолеВвода" } }],
    ["Реквизиты", { Значение: { Тип: "Строка" } }],
  ])("запрещает свойство тела %s у обычной формы", (property, value) => {
    expect(formSchema.Check({ ТипФормы: "Обычная", [property]: value })).toBe(false)
  })

  it("разрешает свойства тела у управляемой формы", () => {
    expect(formSchema.Check({ Ширина: 100 })).toBe(true)
  })
})
