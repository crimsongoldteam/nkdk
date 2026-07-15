import { compileValidationSchema } from "./../../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../../orchestration/property/toJSONSchema"
import { mockContext } from "../../../../tests/mockContext"
import "./toJSONSchema"

const schemaFor = () => {
  const schema = exportPropertyToJSONSchema({
    context: mockContext,
    rule: { type: "AppearanceFields", yaml: "Оформление" },
    value: undefined,
  })
  if (schema === undefined) throw new Error("schema is undefined")
  return compileValidationSchema(schema)
}

describe("AppearanceFields exportToJSONSchema", { timeout: 30_000 }, () => {
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
        Формат: {
          Тип: "МногоязычнаяСтрока",
          Значение: "ЧЦ=3; ЧДЦ=2",
        },
        Текст: {
          Тип: "МногоязычнаяСтрока",
          Значение: "Текст",
        },
      })
    ).toBe(true)
  })

  it("rejects YAML shapes that appearance import would ignore", () => {
    const compiled = schemaFor()

    expect(compiled.Check({ Видимость: { Тип: "ВидСравненияКомпоновкиДанных", Значение: "Равно" } })).toBe(false)
    expect(compiled.Check({ Шрифт: { Вид: "ШрифтТекста", Лишнее: "x" } })).toBe(false)
  })

  it("accepts omitted value for color SettingsParameterValue", () => {
    const compiled = schemaFor()

    expect(compiled.Check({ ЦветТекста: null })).toBe(true)
    expect(compiled.Check({ ЦветТекста: "" })).toBe(true)
    expect(compiled.Check({ ЦветТекста: undefined })).toBe(true)
    expect(compiled.Errors({ ЦветТекста: undefined })).toEqual([true, []])
    expect(compiled.Check({ ЦветФона: undefined })).toBe(true)
    expect(compiled.Check({ ЦветФона: { Использовать: "Ложь" } })).toBe(true)
  })

  it("accepts explicit text type marker without value", () => {
    const compiled = schemaFor()

    expect(compiled.Check({ Текст: { Тип: "МногоязычнаяСтрока" } })).toBe(true)
    expect(compiled.Check({ Формат: { Использовать: "Ложь", Тип: "МногоязычнаяСтрока" } })).toBe(true)
    expect(compiled.Check({ Текст: { Тип: "МногоязычнаяФорматированнаяСтрока" } })).toBe(true)
  })

  it("keeps explicit text value validation strict when value is present", () => {
    const compiled = schemaFor()

    expect(compiled.Check({ Текст: { Тип: "МногоязычнаяСтрока", Значение: 42 } })).toBe(false)
    expect(compiled.Check({ Текст: { Тип: "МногоязычнаяСтрока", Лишнее: "x" } })).toBe(false)
  })

  it("does not accept auto as a normal color value", () => {
    const compiled = schemaFor()

    expect(compiled.Check({ ЦветТекста: "auto" })).toBe(false)
  })
})
