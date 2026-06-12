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
})
