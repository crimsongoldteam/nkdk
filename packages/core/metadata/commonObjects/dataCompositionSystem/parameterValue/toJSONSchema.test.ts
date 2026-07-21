import { compileValidationSchema, type ValidationSchemaValidator } from "./../../../validation/compileValidationSchema"
import { beforeAll, describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../../orchestration/property/toJSONSchema"
import { mockContext } from "../../../../tests/mockContext"
import type { SettingsParameterValuePropertyRule } from "./types"
import "./toJSONSchema"

const compiledSchemas = new Map<string, ValidationSchemaValidator>()

const schemaFor = (rule: SettingsParameterValuePropertyRule) => {
  const cacheKey = `${rule.valueType}:${rule.yaml}`
  const cached = compiledSchemas.get(cacheKey)
  if (cached !== undefined) return cached

  const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
  if (schema === undefined) throw new Error("schema is undefined")
  const compiled = compileValidationSchema(schema, { eagerFallback: true })
  compiledSchemas.set(cacheKey, compiled)
  return compiled
}

const errorsFor = (rule: SettingsParameterValuePropertyRule, value: unknown): string[] =>
  schemaFor(rule)
    .Errors(value)[1]
    .map((error) => `${error.instancePath}: ${error.message}`)

describe("SettingsParameterValue exportToJSONSchema", { timeout: 30_000 }, () => {
  beforeAll(() => {
    ;(
      [
        { type: "SettingsParameterValue", valueType: "Color", yaml: "Цвет" },
        { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветФона" },
        { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" },
        { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Значение" },
        {
          type: "SettingsParameterValue",
          valueType: "SystemEnumeration",
          typeSE: "HorizontalAlign",
          yaml: "ГоризонтальноеПоложение",
        },
        { type: "SettingsParameterValue", valueType: "Parameter", yaml: "ПараметрыВыбора" },
        { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Формат" },
        { type: "SettingsParameterValue", valueType: "Field", yaml: "Поле" },
        { type: "SettingsParameterValue", valueType: "Field", yaml: "Параметр" },
        { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" },
        { type: "SettingsParameterValue", valueType: "ChoiceParameterLinks", yaml: "СвязиПараметровВыбора" },
      ] as const
    ).forEach(schemaFor)
  }, 180_000)

  it("accepts compact Color YAML value", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Color", yaml: "Цвет" } as const

    expect(errorsFor(rule, "#1C55AE")).toEqual([])
  })

  it("accepts omitted top-level value for Color only", () => {
    const colorRule = { type: "SettingsParameterValue", valueType: "Color", yaml: "Цвет" } as const
    const primitiveRule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const
    const fieldRule = { type: "SettingsParameterValue", valueType: "Field", yaml: "Поле" } as const
    const fontRule = { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" } as const
    const designTimeRule = { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Формат" } as const

    expect(errorsFor(colorRule, undefined)).toEqual([])
    expect(errorsFor(colorRule, "")).toEqual([])
    expect(errorsFor(primitiveRule, undefined)).not.toEqual([])
    expect(errorsFor(fieldRule, undefined)).not.toEqual([])
    expect(errorsFor(fontRule, undefined)).not.toEqual([])
    expect(errorsFor(designTimeRule, undefined)).not.toEqual([])
  })

  it("accepts compact Primitive YAML value", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(errorsFor(rule, "Ложь")).toEqual([])
  })

  it("accepts compact SystemEnumeration YAML value", () => {
    const rule = {
      type: "SettingsParameterValue",
      valueType: "SystemEnumeration",
      typeSE: "HorizontalAlign",
      yaml: "ГоризонтальноеПоложение",
    } as const

    expect(errorsFor(rule, "Лево")).toEqual([])
  })

  it("accepts compact explicit DCS object values", () => {
    const fieldRule = { type: "SettingsParameterValue", valueType: "Field", yaml: "Поле" } as const
    const designTimeRule = { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Формат" } as const
    const primitiveRule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(errorsFor(fieldRule, { Тип: "Строка", Значение: "abc" })).toEqual([])
    expect(errorsFor(designTimeRule, { Тип: "Поле", Значение: "СписокФайлов.Представление" })).toEqual([])
    expect(
      errorsFor(primitiveRule, {
        Тип: "СистемноеПеречисление",
        Имя: "HorizontalAlign",
        Значение: "Лево",
      })
    ).toEqual([])
  })

  it("accepts compact object values with value-specific markers", () => {
    const primitiveRule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Значение" } as const
    const fontRule = { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" } as const

    expect(errorsFor(primitiveRule, { Представление: "Физическое лицо", Значение: '"ФЛ"' })).toEqual([])
    expect(errorsFor(fontRule, { Вид: "Абсолютный", Значение: "Arial" })).toEqual([])
  })

  it("accepts compact Parameter YAML value with choice parameter named Parameter", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Parameter", yaml: "ПараметрыВыбора" } as const

    expect(errorsFor(rule, { Параметр: 123 })).toEqual([])
  })

  it("accepts strict full object with settings fields and nested elements", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветФона" } as const

    expect(
      errorsFor(rule, {
        Использовать: "Ложь",
        Значение: "#1C55AE",
        РежимОтображения: "БыстрыйДоступ",
        ИдентификаторПользовательскойНастройки: "BackgroundColor",
        ПредставлениеПользовательскойНастройки: { ru: "Цвет фона" },
        Элементы: [
          "#000000",
          {
            Использовать: "Ложь",
            Значение: "Красный",
            Элементы: ["#FFFFFF"],
          },
        ],
      })
    ).toEqual([])
  })

  it("accepts full value-only form as canonical SettingsParameterValue YAML", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Color", yaml: "Цвет" } as const

    expect(errorsFor(rule, { Значение: "#FF0000" })).toEqual([])
  })

  it("accepts full object with array value for DesignTimeValue", () => {
    const rule = { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Формат" } as const

    expect(
      errorsFor(rule, {
        Значение: ["ЧДЦ=1", { Тип: "Поле", Значение: "СписокФайлов.Представление" }],
      })
    ).toEqual([])
  })

  it("accepts full object with explicit string marker for Field", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Field", yaml: "Параметр" } as const

    expect(errorsFor(rule, { Использовать: "Ложь", Тип: "Строка", Значение: "" })).toEqual([])
    expect(errorsFor(rule, { Использовать: "Ложь", Тип: "Строка", Значение: "abc" })).toEqual([])
    expect(errorsFor(rule, { Использовать: "Ложь", Тип: "Строка" })).not.toEqual([])
    expect(errorsFor(rule, { Использовать: "Ложь", Тип: "ЧтоТо", Значение: "" })).not.toEqual([])
  })

  it("accepts object values inside full wrapper", () => {
    const parameterRule = { type: "SettingsParameterValue", valueType: "Parameter", yaml: "ПараметрыВыбора" } as const
    const fontRule = { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" } as const
    const choiceParameterLinksRule = {
      type: "SettingsParameterValue",
      valueType: "ChoiceParameterLinks",
      yaml: "СвязиПараметровВыбора",
    } as const

    expect(errorsFor(parameterRule, { Значение: { Параметр: 123 } })).toEqual([])
    expect(errorsFor(fontRule, { Значение: { Вид: "Абсолютный", Значение: "Arial" } })).toEqual([])
    expect(
      errorsFor(choiceParameterLinksRule, {
        Значение: [{ Имя: "Параметр", ПутьКДанным: "Поле", РежимИзменения: "НеИзменять" }],
      })
    ).toEqual([])
  })

  it("rejects explicit true use flag", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(schemaFor(rule).Check({ Использовать: "Истина" })).toBe(false)
  })

  it("rejects parameter key in full object", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Color", yaml: "Цвет" } as const

    expect(schemaFor(rule).Check({ Параметр: "Цвет", Значение: "#1C55AE" })).toBe(false)
  })

  it("rejects parameter key in non-Parameter compact objects", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" } as const

    expect(schemaFor(rule).Check({ Параметр: "Шрифт" })).toBe(false)
  })

  it("rejects wrapper-like objects with unsupported explicit type marker", () => {
    const fontRule = { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" } as const
    const parameterRule = { type: "SettingsParameterValue", valueType: "Parameter", yaml: "ПараметрыВыбора" } as const

    expect(schemaFor(fontRule).Check({ Тип: "Строка", Значение: "Arial" })).toBe(false)
    expect(schemaFor(fontRule).Check({ Тип: "Строка", Параметр: "Шрифт" })).toBe(false)
    expect(schemaFor(parameterRule).Check({ Тип: "Строка", Параметр: "Имя", Использовать: "Ложь" })).toBe(false)
  })

  it("rejects Font marker combined with wrapper keys", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" } as const

    expect(schemaFor(rule).Check({ Вид: "Абсолютный", Использовать: "Ложь" })).toBe(false)
    expect(schemaFor(rule).Check({ Вид: "Абсолютный", Элементы: [] })).toBe(false)
    expect(schemaFor(rule).Check({ Вид: "Абсолютный", РежимОтображения: "БыстрыйДоступ" })).toBe(false)
    expect(schemaFor(rule).Check({ Вид: "Абсолютный", Параметр: "Шрифт" })).toBe(false)
  })

  it("rejects parameter key combined with wrapper fields for ChoiceParameters", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Parameter", yaml: "ПараметрыВыбора" } as const

    expect(schemaFor(rule).Check({ Параметр: "Имя", Использовать: "Ложь" })).toBe(false)
    expect(schemaFor(rule).Check({ Параметр: "Имя", РежимОтображения: "БыстрыйДоступ" })).toBe(false)
    expect(schemaFor(rule).Check({ Параметр: "Имя", Элементы: [] })).toBe(false)
  })

  it("rejects unsupported explicit DCS-like object", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(schemaFor(rule).Check({ Тип: "ЧтоТо", Значение: "x" })).toBe(false)
  })

  it("rejects wrapper-like compact objects without parameter key", () => {
    const parameterRule = { type: "SettingsParameterValue", valueType: "Parameter", yaml: "ПараметрыВыбора" } as const
    const fontRule = { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" } as const

    expect(schemaFor(parameterRule).Check({ Значение: 123 })).toBe(false)
    expect(schemaFor(parameterRule).Check({ Использовать: "Ложь", Значение: 123 })).toBe(false)
    expect(schemaFor(fontRule).Check({ Значение: "Arial" })).toBe(false)
    expect(schemaFor(fontRule).Check({ Использовать: "Ложь", Значение: "Arial" })).toBe(false)
  })

  it("rejects extra array wrapper for ChoiceParameterLinks value", () => {
    const rule = {
      type: "SettingsParameterValue",
      valueType: "ChoiceParameterLinks",
      yaml: "СвязиПараметровВыбора",
    } as const

    expect(schemaFor(rule).Check({ Значение: ["Параметр(Поле)", "ДругойПараметр(ДругоеПоле)"] })).toBe(false)
    expect(schemaFor(rule).Check({ Значение: [[{ Имя: "Параметр", ПутьКДанным: "Поле" }]] })).toBe(false)
  })

  it("rejects unknown full object key", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Color", yaml: "Цвет" } as const

    expect(schemaFor(rule).Check({ Значение: "#1C55AE", Лишнее: "значение" })).toBe(false)
  })

  it("rejects empty object for Primitive and Font while accepting non-empty Font compact object", () => {
    const primitiveRule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const
    const fontRule = { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" } as const

    expect(schemaFor(primitiveRule).Check({})).toBe(false)
    expect(schemaFor(fontRule).Check({})).toBe(false)
    expect(errorsFor(fontRule, { Вид: "ШрифтТекста" })).toEqual([])
  })

  it("rejects empty nested element", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(schemaFor(rule).Check({ Элементы: [{}] })).toBe(false)
  })

  it("accepts top-level null when DCS value schema allows null", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(errorsFor(rule, null)).toEqual([])
  })
})
