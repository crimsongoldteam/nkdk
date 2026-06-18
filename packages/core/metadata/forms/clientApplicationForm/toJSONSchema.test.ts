import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { getTypeRule, type PropertyRule } from "~/metadata/orchestration"
import { registerCoreMetadata } from "~/metadata/register"
import { mockContext } from "~/tests/mockContext"

registerCoreMetadata()

const rule = { type: "ClientApplicationForm" } as Extract<PropertyRule, { type: "ClientApplicationForm" }>

describe("ClientApplicationForm exportToJSONSchema type rule", () => {
  it("accepts inline form properties", () => {
    const exportToJSONSchema = getTypeRule("ClientApplicationForm", "exportToJSONSchema")
    expect(exportToJSONSchema).toBeDefined()
    if (exportToJSONSchema === undefined) throw new Error("ClientApplicationForm JSON schema export is not registered")

    const schema = exportToJSONSchema({ context: mockContext, rule, value: undefined })
    expect(schema).toBeDefined()
    if (schema === undefined) throw new Error("ClientApplicationForm JSON schema is not registered")

    const compiled = TypeCompiler.Compile(schema)

    expect(
      compiled.Check({
        КоманднаяПанель: {
          Автозаполнение: "Ложь",
          ГоризонтальноеПоложение: "Право",
        },
        Реквизиты: {
          Объект: {
            Тип: "СправочникОбъект.Товары",
          },
        },
        Элементы: {
          Наименование: {
            Вид: "ПолеВвода",
          },
        },
      })
    ).toBe(true)
  })
})
