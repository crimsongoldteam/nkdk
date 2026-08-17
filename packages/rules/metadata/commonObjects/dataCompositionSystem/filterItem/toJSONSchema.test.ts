import { compileValidationSchema } from "./../../../validation/compileValidationSchema"
import { beforeAll, describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"
import "./types"
import { mockLanguages } from "../../../../tests/mockContext"
import type { ConfigurationContext } from "@nkdk/runtime"

const context = {
  languages: mockLanguages,
  version: "2.20",
} as const

describe("FilterItem JSON Schema", () => {
  const compileFilterItemSchema = (schemaContext: ConfigurationContext = context) => {
    const schema = exportPropertyToJSONSchema({
      context: schemaContext,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })

    return compileValidationSchema(schema!)
  }

  let compiled: ReturnType<typeof compileFilterItemSchema>

  beforeAll(() => {
    compiled = compileFilterItemSchema()
  })

  it("accepts comparison items", () => {
    expect(compiled.Check([{ ЛевоеЗначение: ".ХозяйственнаяОперация", Использование: "Ложь" }])).toBe(true)
  })

  it("accepts InList comparison items with string array right value", () => {
    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Состояние",
          ВидСравнения: "ВСписке",
          ПравоеЗначение: ["'Согласовано'", "'Не согласовано'"],
        },
      ])
    ).toBe(true)
  })

  it("accepts InList comparison items with enumeration-reference array right value", () => {
    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Объект.ВНА.СпособНачисленияАмортизацииМСФО",
          ВидСравнения: "ВСписке",
          ПравоеЗначение: [
            "Перечисление.СпособыНачисленияАмортизацииВНА.Линейный",
            "Перечисление.СпособыНачисленияАмортизацииВНА.УменьшаемогоОстатка",
          ],
        },
      ])
    ).toBe(true)
  })

  it("accepts InList comparison items with nil object in right value array", () => {
    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Объект.Корректировки.Документ",
          ВидСравнения: "ВСписке",
          ПравоеЗначение: [
            "Документ.ВыбытиеИнвестиций.ПустаяСсылка",
            "Документ.ПоступлениеИнвестиций.ПустаяСсылка",
            {},
          ],
        },
      ])
    ).toBe(true)
  })

  it("accepts InList comparison items with only nil objects in right value array", () => {
    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Тип",
          ВидСравнения: "ВСписке",
          ПравоеЗначение: [{}, {}],
        },
      ])
    ).toBe(true)
  })

  it("keeps accepting scalar comparison right value", () => {
    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Просрочен",
          ПравоеЗначение: "Истина",
        },
      ])
    ).toBe(true)
  })

  it("accepts field right value in comparison items", () => {
    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Ссылка.Реквизит1",
          ПравоеЗначение: ".ПараметрыДанных.Параметр1",
          Представление: '"Английское"',
        },
      ])
    ).toBe(true)
  })

  it("accepts non-empty !xml/value only in the validation schema", () => {
    const validation = compileFilterItemSchema({
      ...context,
      exportToJSONSchema: { mode: "inline" as const, refs: new Set<string>(), explicitXMLValues: true as const },
    })
    const external = compileFilterItemSchema({
      ...context,
      exportToJSONSchema: { mode: "externalRefs" as const, refs: new Set<string>() },
    })

    for (const property of ["ЛевоеЗначение", "ПравоеЗначение"] as const) {
      const value = [{ [property]: "!xml/value НеизвестныйИсточник.Поле" }]
      expect(validation.Check(value)).toBe(true)
      expect(external.Check(value)).toBe(false)
      expect(validation.Check([{ [property]: "!xml/value" }])).toBe(false)
    }
  })

  it("does not accept array-shaped left value", () => {
    expect(
      compiled.Check([
        {
          ЛевоеЗначение: [".Состояние"],
          ВидСравнения: "ВСписке",
          ПравоеЗначение: ["'Согласовано'", "'Не согласовано'"],
        },
      ])
    ).toBe(false)
  })

  it("does not accept nil object as scalar right value", () => {
    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Тип",
          ПравоеЗначение: {},
        },
      ])
    ).toBe(false)
  })

  it("does not accept nil object as left value", () => {
    expect(
      compiled.Check([
        {
          ЛевоеЗначение: {},
          ВидСравнения: "ВСписке",
          ПравоеЗначение: [{}, {}],
        },
      ])
    ).toBe(false)
  })

  it("accepts group items with nested elements", () => {
    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИли",
          Элементы: [{ ЛевоеЗначение: ".ХозяйственнаяОперация" }],
        },
      ])
    ).toBe(true)
  })

  it("accepts AND group items with nested comparisons", () => {
    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИ",
          Элементы: [
            {
              ЛевоеЗначение: ".Реквизит2",
              ВидСравнения: "Содержит",
              ПравоеЗначение: "'abc'",
            },
          ],
        },
      ])
    ).toBe(true)
  })

  it("accepts group presentation as design-time string", () => {
    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИли",
          Представление: '"ГруппаОрганизацияПредприятие"',
        },
      ])
    ).toBe(true)
  })

  it("accepts disabled group with nested elements and design-time presentation", () => {
    expect(
      compiled.Check([
        {
          Использование: "Ложь",
          ТипГруппы: "ГруппаИли",
          Элементы: [
            {
              Использование: "Ложь",
              ЛевоеЗначение: ".ИсполняетсяТекущимПользователем",
              ПравоеЗначение: "Истина",
            },
            {
              Использование: "Ложь",
              ЛевоеЗначение: ".СогласуетсяТекущимПользователем",
              ПравоеЗначение: "Истина",
            },
          ],
          Представление: '"Мои отчеты"',
        },
      ])
    ).toBe(true)
  })

  it("accepts group user setting presentation as design-time string", () => {
    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИ",
          ПредставлениеПользовательскойНастройки: '"Ожидают обеспечения"',
        },
      ])
    ).toBe(true)
  })

  it("accepts nested groups with comparison items", () => {
    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИли",
          Элементы: [
            {
              ТипГруппы: "ГруппаИли",
              Элементы: [{ ЛевоеЗначение: ".X" }],
            },
          ],
        },
      ])
    ).toBe(true)
  })

  it("rejects record-shaped values", () => {
    expect(compiled.Check({ item: { ЛевоеЗначение: ".ХозяйственнаяОперация" } })).toBe(false)
  })

  it("rejects invalid nested elements", () => {
    expect(compiled.Check([{ ТипГруппы: "ГруппаИли", Элементы: [123] }])).toBe(false)
    expect(compiled.Check([{ ТипГруппы: "ГруппаИли", Элементы: [{ Неизвестно: "x" }] }])).toBe(false)
  })
})
