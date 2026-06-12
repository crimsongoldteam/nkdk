import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { registerCoreMetadata } from "~/metadata/register"
import { mockContext } from "~/tests/mockContext"

registerCoreMetadata()

const schemaFor = (type: string) => {
  const exportToJSONSchema = getTypeRule(type, "exportToJSONSchema")
  expect(exportToJSONSchema).toBeDefined()
  return TypeCompiler.Compile(exportToJSONSchema!({ context: mockContext, rule: { type } as never, value: undefined }))
}

describe("YAML type JSON Schema registrations", () => {
  it("accepts simple hand-written YAML types", () => {
    expect(schemaFor("AssociatedTable").Check("Товары")).toBe(true)
    expect(schemaFor("ChildSubsystemNames").Check(["Подсистема1", "Подсистема2"])).toBe(true)
    expect(
      schemaFor("CommonAttributeContent").Check([
        { Объект: "Документ.ЗаказКлиента", Использование: "Использовать" },
      ])
    ).toBe(true)
  })

  it("accepts rule-backed DCS grouping YAML", () => {
    expect(schemaFor("GroupItemAuto").Check({ Использование: "Истина" })).toBe(true)
    expect(schemaFor("GroupItemField").Check({ Поле: "Номенклатура", ТипГруппировки: "Элементы" })).toBe(true)
    expect(schemaFor("StructureItemGroup").Check({ ПоляГруппировки: [{ Поле: "Номенклатура" }] })).toBe(true)
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
})
