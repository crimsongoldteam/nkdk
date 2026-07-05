import Schema from "typebox/schema"
import { beforeAll, describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../../orchestration/property/toJSONSchema"
import { mockContext } from "../../../../tests/mockContext"
import type { DcsMetadataValuePropertyRule } from "./types"
import "./toJSONSchema"

const compiledSchemas = new Map<string, ReturnType<typeof Schema.Compile>>()

const schemaFor = (rule: DcsMetadataValuePropertyRule) => {
  const cacheKey = `${rule.valueType}:${rule.yaml}`
  const cached = compiledSchemas.get(cacheKey)
  if (cached !== undefined) return cached

  const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
  if (schema === undefined) throw new Error("schema is undefined")
  const compiled = Schema.Compile(schema)
  compiledSchemas.set(cacheKey, compiled)
  return compiled
}

const errorsFor = (rule: DcsMetadataValuePropertyRule, value: unknown): string[] =>
  schemaFor(rule).Errors(value)[1].map((error) => `${error.instancePath}: ${error.message}`)

describe("MetadataDcsMetadataValue exportToJSONSchema", () => {
  beforeAll(() => {
    ;(
      [
        { type: "MetadataDcsMetadataValue", valueType: "Color", yaml: "Цвет" },
        { type: "MetadataDcsMetadataValue", valueType: "Font", yaml: "Шрифт" },
        { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "Формат" },
        { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "Видимость" },
        { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "Поле" },
      ] as const
    ).forEach(schemaFor)
  }, 60_000)

  it("accepts Color YAML values", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Color", yaml: "Цвет" } as const

    expect(errorsFor(rule, "ЭлементСтиля.ТекстЗапрещеннойЯчейкиЦвет")).toEqual([])
    expect(errorsFor(rule, "ЦветФонаПодсказки")).toEqual([])
    expect(errorsFor(rule, "#1C55AE")).toEqual([])
  })

  it("accepts Font YAML object", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Font", yaml: "Шрифт" } as const

    expect(errorsFor(rule, { Вид: "ШрифтТекста", Размер: 10, Полужирный: "Истина" })).toEqual([])
  })

  it("accepts DesignTimeValue compact and explicit text values", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "Формат" } as const

    expect(errorsFor(rule, '"ЧДЦ=1"')).toEqual([])
    expect(errorsFor(rule, { ru: "Текст" })).toEqual([])
    expect(errorsFor(rule, { Тип: "Поле", Значение: "СписокФайлов.Представление" })).toEqual([])
    expect(errorsFor(rule, { Тип: "ЗначениеВремениПроектирования", Значение: "Перечисление.X.Y" })).toEqual([])
    expect(errorsFor(rule, { Тип: "МногоязычнаяСтрока", Значение: "ЧЦ=3; ЧДЦ=2" })).toEqual([])
    expect(errorsFor(rule, { Тип: "МногоязычнаяСтрока", Значение: { ru: "Текст" } })).toEqual([])
    expect(errorsFor(rule, { Тип: "МногоязычнаяСтрока" })).toEqual([])
    expect(errorsFor(rule, { Тип: "МногоязычнаяФорматированнаяСтрока" })).toEqual([])
    expect(errorsFor(rule, { Тип: "МногоязычнаяСтрока", Лишнее: "x" })).not.toEqual([])
  })

  it("accepts Primitive values and explicit DCS system enumeration", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(errorsFor(rule, null)).toEqual([])
    expect(errorsFor(rule, "Ложь")).toEqual([])
    expect(errorsFor(rule, 123)).toEqual([])
    expect(errorsFor(rule, { Значение: "Истина" })).toEqual([])
    expect(errorsFor(rule, { Значение: ["Перечисление.ТипыДоговоров.СПоставщиком"] })).toEqual([])
    expect(
      errorsFor(rule, {
        Тип: "СистемноеПеречисление",
        Имя: "HorizontalAlign",
        Значение: "Лево",
      })
    ).toEqual([])
  })

  it("accepts Primitive arrays with explicit DCS system enumeration", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(
      errorsFor(rule, [
        "Ложь",
        {
          Тип: "СистемноеПеречисление",
          Имя: "HorizontalAlign",
          Значение: "Лево",
        },
      ])
    ).toEqual([])
    expect(
      errorsFor(rule, [
        {
          Тип: "СистемноеПеречисление",
          Имя: "HorizontalAlign",
          Значение: "Лево",
        },
        null,
      ])
    ).toEqual([])
  })

  it("rejects unknown explicit DCS system enumeration name and value", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(
      schemaFor(rule).Check({
        Тип: "СистемноеПеречисление",
        Имя: "UnknownEnumeration",
        Значение: "Лево",
      })
    ).toBe(false)
    expect(
      schemaFor(rule).Check({
        Тип: "СистемноеПеречисление",
        Имя: "HorizontalAlign",
        Значение: "НетТакогоПоложения",
      })
    ).toBe(false)
    expect(
      schemaFor(rule).Check({
        Тип: "СистемноеПеречисление",
        Имя: "SynchronousPlatformExtensionAndAddInCallUseMode",
        Значение: "Использовать",
      })
    ).toBe(false)
  })

  it("rejects extra properties in explicit DCS values", () => {
    const primitiveRule = { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "Видимость" } as const
    const fieldRule = { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "Поле" } as const
    const designTimeRule = { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "Формат" } as const

    expect(
      schemaFor(primitiveRule).Check({
        Тип: "СистемноеПеречисление",
        Имя: "HorizontalAlign",
        Значение: "Лево",
        Лишнее: "значение",
      })
    ).toBe(false)
    expect(schemaFor(fieldRule).Check({ Тип: "Строка", Значение: "", Лишнее: "значение" })).toBe(false)
    expect(schemaFor(designTimeRule).Check({ Тип: "Поле", Значение: "Поле", Лишнее: "значение" })).toBe(false)
    expect(schemaFor(primitiveRule).Check({ Тип: "ВидСчета", Значение: "Активный", Лишнее: "значение" })).toBe(false)
    expect(schemaFor(primitiveRule).Check([[1]])).toBe(false)
    expect(schemaFor(primitiveRule).Check({ Вариант: "Вчера", Лишнее: "значение" })).toBe(false)
  })

  it("rejects empty and unknown objects in Primitive metadata values", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "Видимость" } as const

    expect(schemaFor(rule).Check({})).toBe(false)
    expect(schemaFor(rule).Check({ Лишнее: "x" })).toBe(false)
  })

  it("rejects unsupported DesignTimeValue metadata values", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "Формат" } as const

    expect(schemaFor(rule).Check(123)).toBe(false)
    expect(schemaFor(rule).Check(["Строка", 123])).toBe(false)
    expect(schemaFor(rule).Check({})).toBe(false)
    expect(schemaFor(rule).Check({ "ru-RU-extra": "x" })).toBe(false)
    expect(schemaFor(rule).Check({ type: "unknown", value: {} })).toBe(false)
  })

  it("accepts SystemEnumeration values from rule.typeSE", () => {
    const rule = {
      type: "MetadataDcsMetadataValue",
      valueType: "SystemEnumeration",
      typeSE: "HorizontalAlign",
      yaml: "ГоризонтальноеПоложение",
    } as const

    expect(errorsFor(rule, "Лево")).toEqual([])
    expect(schemaFor(rule).Check("НетТакогоПоложения")).toBe(false)
  })

  it("accepts Field explicit primitive string", () => {
    const rule = { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "Поле" } as const

    expect(errorsFor(rule, { Тип: "Строка", Значение: "" })).toEqual([])
  })
})
