import { compileValidationSchema } from "./../../../validation/compileValidationSchema"
import { beforeAll, describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"
import { mockContext } from "../../../../tests/mockContext"
import "./toJSONSchema"

let compiledAppearanceFieldsSchema: ReturnType<typeof compileValidationSchema>

const schemaFor = () => {
  const schema = exportPropertyToJSONSchema({
    context: mockContext,
    rule: { type: "AppearanceFields", yaml: "Оформление" },
    value: undefined,
  })
  if (schema === undefined) throw new Error("schema is undefined")
  return compileValidationSchema(schema, { eagerFallback: true })
}

describe("AppearanceFields exportToJSONSchema", { timeout: 30_000 }, () => {
  beforeAll(() => {
    compiledAppearanceFieldsSchema = schemaFor()
  })

  it("accepts compact SettingsParameterValue fields", () => {
    const compiled = compiledAppearanceFieldsSchema

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
        Формат: "ЧЦ=3; ЧДЦ=2",
        Текст: { Значение: { ru: "Текст" } },
      })
    ).toBe(true)
  })

  it("rejects YAML shapes that appearance import would ignore", () => {
    const compiled = compiledAppearanceFieldsSchema

    expect(compiled.Check({ Видимость: { Тип: "ВидСравненияКомпоновкиДанных", Значение: "Равно" } })).toBe(false)
    expect(compiled.Check({ Шрифт: { Вид: "ШрифтТекста", Лишнее: "x" } })).toBe(false)
  })

  it("accepts only explicit marker for DCS auto color", () => {
    const compiled = compiledAppearanceFieldsSchema

    expect(compiled.Check({ ЦветТекста: "Авто" })).toBe(true)
    expect(compiled.Check({ ЦветТекста: null })).toBe(false)
    expect(compiled.Check({ ЦветТекста: "" })).toBe(false)
    expect(compiled.Check({ ЦветТекста: undefined })).toBe(false)
    expect(compiled.Check({ ЦветФона: { Использовать: "Ложь" } })).toBe(false)
    expect(compiled.Check({ ЦветФона: { Использовать: "Ложь", Значение: "Авто" } })).toBe(true)
  })

  it.each([
    "",
    "Строка",
    {},
    { Значение: {} },
    { Значение: { ru: "Строка" } },
    { Значение: { Тип: "язык Тип", Значение: "язык Значение", Форматированный: "язык Форматированный" } },
    { Тип: "Поле", Значение: "Таблица.Поле" },
    { Тип: "ФорматированнаяСтрока", Значение: {} },
    { Значение: null },
    { Использовать: "Ложь", Значение: { ru: "Строка" } },
    { Тип: "Поле", Значение: "Таблица.Поле", Использовать: "Ложь" },
  ])("accepts canonical appearance string value %#", (value) => {
    expect(compiledAppearanceFieldsSchema.Check({ Текст: value })).toBe(true)
    expect(compiledAppearanceFieldsSchema.Check({ Формат: value })).toBe(true)
  })

  it.each([
    null,
    { ru: "x" },
    { Тип: "МногоязычнаяСтрока", Значение: { ru: "x" } },
    { Тип: "Поле" },
    { Тип: "Поле", Значение: { ru: "x" } },
    { Тип: "ФорматированнаяСтрока", Значение: "x" },
    { Форматированный: "Истина", Текст: {} },
    { Значение: { ru: 1 } },
    { Значение: "x", Лишнее: true },
  ])("rejects non-canonical appearance string value %#", (value) => {
    expect(compiledAppearanceFieldsSchema.Check({ Текст: value })).toBe(false)
    expect(compiledAppearanceFieldsSchema.Check({ Формат: value })).toBe(false)
  })

  it("does not accept auto as a normal color value", () => {
    const compiled = compiledAppearanceFieldsSchema

    expect(compiled.Check({ ЦветТекста: "auto" })).toBe(false)
  })
})
