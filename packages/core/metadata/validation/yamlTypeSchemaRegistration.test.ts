import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { getTypeRule, PropertyRule } from "~/metadata/orchestration"
import { registerCoreMetadata } from "~/metadata/register"
import { mockContext } from "~/tests/mockContext"

registerCoreMetadata()

type SchemaRuleType =
  | "AssociatedTable"
  | "ChildSubsystemNames"
  | "CommonAttributeContent"
  | "GroupItemAuto"
  | "GroupItemField"
  | "StructureItemGroup"
  | "StructureItemGroupCollection"

const schemaFor = (type: SchemaRuleType) => {
  const exportToJSONSchema = getTypeRule(type, "exportToJSONSchema")
  expect(exportToJSONSchema).toBeDefined()
  if (exportToJSONSchema === undefined) throw new Error(`${type} JSON schema export is not registered`)

  const rule: PropertyRule =
    type === "ChildSubsystemNames"
      ? { type, xml: "Subsystem" }
      : ({ type } as Extract<PropertyRule, { type: typeof type }>)
  const schema = exportToJSONSchema({ context: mockContext, rule, value: undefined })
  expect(schema).toBeDefined()
  if (schema === undefined) throw new Error(`${type} JSON schema is not registered`)

  return TypeCompiler.Compile(schema)
}

describe("YAML type JSON Schema registrations", () => {
  it("accepts simple hand-written YAML types", () => {
    expect(schemaFor("AssociatedTable").Check("Товары")).toBe(true)
    expect(schemaFor("ChildSubsystemNames").Check(["Подсистема1", "Подсистема2"])).toBe(true)
    expect(
      schemaFor("CommonAttributeContent").Check([{ Объект: "Документ.ЗаказКлиента", Использование: "Использовать" }])
    ).toBe(true)
  })

  it("accepts rule-backed DCS grouping YAML", () => {
    expect(schemaFor("GroupItemAuto").Check("[Авто]")).toBe(true)
    expect(schemaFor("GroupItemAuto").Check("([Авто])")).toBe(true)
    expect(schemaFor("GroupItemField").Check("Номенклатура")).toBe(true)
    expect(schemaFor("GroupItemField").Check("(Номенклатура)")).toBe(true)
    expect(schemaFor("GroupItemField").Check({ Поле: "Номенклатура", ТипГруппировки: "Элементы" })).toBe(true)
    expect(schemaFor("GroupItemField").Check({ Поле: "Номенклатура", НачалоПериода: "01.01.2026 12:30" })).toBe(true)
    expect(
      schemaFor("StructureItemGroupCollection").Check(["Наименование", "[Авто]", { Поле: "ПометкаУдаления" }])
    ).toBe(true)
    expect(schemaFor("StructureItemGroup").Check(["Наименование", "[Авто]", { Поле: "ПометкаУдаления" }])).toBe(true)
  })

  it("rejects invalid simple hand-written YAML types", () => {
    expect(schemaFor("AssociatedTable").Check(["Товары"])).toBe(false)
    expect(schemaFor("AssociatedTable").Check({ Таблица: "Товары" })).toBe(false)

    expect(schemaFor("ChildSubsystemNames").Check("Подсистема1")).toBe(false)
    expect(schemaFor("ChildSubsystemNames").Check(["Подсистема1", 1])).toBe(false)

    const commonAttributeContentSchema = schemaFor("CommonAttributeContent")
    expect(
      commonAttributeContentSchema.Check([
        { Объект: "Документ.ЗаказКлиента", Использование: "НеизвестноеИспользование" },
      ])
    ).toBe(false)
    expect(commonAttributeContentSchema.Check([{ Объект: "Документ.ЗаказКлиента" }])).toBe(false)
    expect(commonAttributeContentSchema.Check([{ Использование: "Использовать" }])).toBe(false)
    expect(
      commonAttributeContentSchema.Check([
        {
          Объект: "Документ.ЗаказКлиента",
          Использование: "Использовать",
          ЛишнееСвойство: "значение",
        },
      ])
    ).toBe(false)
  })

  it("rejects invalid DCS grouping YAML", () => {
    expect(schemaFor("GroupItemAuto").Check({ Использование: "Истина" })).toBe(false)
    expect(schemaFor("GroupItemField").Check("")).toBe(false)
    expect(schemaFor("GroupItemField").Check("()")).toBe(false)
    expect(schemaFor("GroupItemField").Check({ Поле: "" })).toBe(false)
    expect(schemaFor("GroupItemField").Check({ ТипГруппировки: "Элементы" })).toBe(false)
    expect(schemaFor("GroupItemField").Check({ Поле: "Номенклатура", НачалоПериода: "abc" })).toBe(false)
    expect(schemaFor("StructureItemGroup").Check([])).toBe(false)
    expect(schemaFor("StructureItemGroup").Check({ ПоляГруппировки: [{ Поле: "Номенклатура" }] })).toBe(false)
    expect(schemaFor("StructureItemGroupCollection").Check(["Наименование", 1])).toBe(false)
  })
})
