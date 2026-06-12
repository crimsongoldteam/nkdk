import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import "./toJSONSchema"

const schemaFor = () => {
  const schema = exportPropertyToJSONSchema({
    context: mockContext,
    rule: { type: "AppearanceFields", yaml: "Оформление" },
    value: undefined,
  })
  if (schema === undefined) throw new Error("schema is undefined")
  return TypeCompiler.Compile(schema)
}

describe("AppearanceFields exportToJSONSchema", () => {
  it("accepts compact SettingsParameterValue fields", () => {
    const compiled = schemaFor()

    expect(
      compiled.Check({
        ЦветТекста: "ЭлементСтиля.ТекстЗапрещеннойЯчейкиЦвет",
        Шрифт: { Вид: "ШрифтТекста", Размер: 10 },
        ГоризонтальноеПоложение: "Лево",
        Видимость: {
          Тип: "СистемноеПеречисление",
          Имя: "HorizontalAlign",
          Значение: "Лево",
        },
      })
    ).toBe(true)
  })

  it("rejects YAML shapes that appearance import would ignore", () => {
    const compiled = schemaFor()

    expect(compiled.Check({ Видимость: { Тип: "ВидСравненияКомпоновкиДанных", Значение: "Равно" } })).toBe(false)
    expect(compiled.Check({ Шрифт: { Вид: "ШрифтТекста", Лишнее: "x" } })).toBe(false)
  })
})
