import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../../orchestration/property/toJSONSchema"
import "./types"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("FilterItem JSON Schema", () => {
  const compileFilterItemSchema = () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })

    return TypeCompiler.Compile(schema!)
  }

  it("accepts comparison items", () => {
    const compiled = compileFilterItemSchema()

    expect(compiled.Check([{ ЛевоеЗначение: ".ХозяйственнаяОперация", Использование: "Ложь" }])).toBe(true)
  })

  it("accepts InList comparison items with string array right value", () => {
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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

  it("does not accept array-shaped left value", () => {
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

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
    const compiled = compileFilterItemSchema()

    expect(compiled.Check({ item: { ЛевоеЗначение: ".ХозяйственнаяОперация" } })).toBe(false)
  })

  it("rejects invalid nested elements", () => {
    const compiled = compileFilterItemSchema()

    expect(compiled.Check([{ ТипГруппы: "ГруппаИли", Элементы: [123] }])).toBe(false)
    expect(compiled.Check([{ ТипГруппы: "ГруппаИли", Элементы: [{ Неизвестно: "x" }] }])).toBe(false)
  })
})
