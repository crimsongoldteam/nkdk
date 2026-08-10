import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testAtomicFromYAML } from "../../../../tests/property/atomicFromYAML"
import { exportToYAML } from "@nkdk/runtime"
import { importFromYAML } from "@nkdk/runtime"
import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AppearanceFields",
}

describe("import Appearance from YAML", () => {
  const parseViaYamlText = <T>(value: T): T => importFromYAML<T>(exportToYAML(value))

  it("should import YAML to metadata", () => {
    const result = testAtomicFromYAML({
      rule,
      value: fixtureAppearanceFieldsYAML,
    })

    expect(result).toEqual(fixtureAppearanceFields)
  })

  it.each([
    ["string", "Строка", { type: "string", value: "Строка" }],
    ["LocalStringType", { Значение: { ru: "Строка" } }, { items: { ru: "Строка" } }],
    ["empty LocalStringType", { Значение: {} }, { items: {} }],
    ["Field", { Тип: "Поле", Значение: "Таблица.Поле" }, { type: "Field", value: "Таблица.Поле" }],
    [
      "LocalFormattedStringType",
      { Тип: "ФорматированнаяСтрока", Значение: { ru: "Строка" } },
      { type: "LocalFormattedStringType", value: { formatted: true, items: { ru: "Строка" } } },
    ],
    ["nil", { Значение: null }, null],
  ])("imports %s", (_name, yaml, expectedValue) => {
    expect(testAtomicFromYAML({ rule, value: { Текст: yaml } })).toEqual({
      itemType: "AppearanceFields",
      Текст: { parameter: "Текст", value: expectedValue },
    })
  })

  it("imports an appearance parameter without dcscor:value", () => {
    expect(testAtomicFromYAML({ rule, value: { Текст: {} } })).toEqual({
      itemType: "AppearanceFields",
      Текст: { parameter: "Текст" },
    })
  })

  it("treats reserved-looking language names as LocalStringType items", () => {
    expect(
      testAtomicFromYAML({
        rule,
        value: {
          Текст: {
            Значение: {
              Тип: "язык Тип",
              Значение: "язык Значение",
              Форматированный: "язык Форматированный",
            },
          },
        },
      })
    ).toMatchObject({
      Текст: {
        value: {
          items: {
            Тип: "язык Тип",
            Значение: "язык Значение",
            Форматированный: "язык Форматированный",
          },
        },
      },
    })
  })

  it.each([
    [{ Тип: "Неизвестный", Значение: "x" }],
    [{ Тип: "Поле" }],
    [{ Тип: "Поле", Значение: { ru: "x" } }],
    [{ Тип: "ФорматированнаяСтрока", Значение: "x" }],
    [{ Тип: "ФорматированнаяСтрока" }],
    [{ Значение: { ru: 1 } }],
    [{ Значение: "x", Лишнее: true }],
    [null],
  ])("rejects invalid appearance string %#", (yaml) => {
    expect(() => testAtomicFromYAML({ rule, value: { Текст: yaml } })).toThrow(/AppearanceFields YAML/)
  })

  it("imports expanded LocalStringType text appearance", () => {
    const result = testAtomicFromYAML({
      rule,
      value: importFromYAML(`
Текст:
  Использовать: Ложь
  Значение:
    ru: "1"
`),
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        use: false,
        value: {
          items: { ru: "1" },
        },
      },
    })
  })

  it("imports explicit null from serialized expanded text appearance", () => {
    const result = testAtomicFromYAML({
      rule,
      value: importFromYAML(`
Текст:
  Использовать: Ложь
  Значение: null
`),
    })

    expect(result).toMatchObject({
      Текст: {
        use: false,
        value: null,
      },
    })
  })

  it("imports double-quoted numeric-looking text appearance as string value", () => {
    const result = testAtomicFromYAML({
      rule,
      value: parseViaYamlText({
        Текст: "6678",
      }),
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        value: {
          type: "string",
          value: "6678",
        },
      },
    })
  })

  it("imports double-quoted absolute color as color value", () => {
    const result = testAtomicFromYAML({
      rule,
      value: importFromYAML<{ ЦветФона: string }>('ЦветФона: "#000000"'),
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветФона: {
        parameter: "ЦветФона",
        value: {
          type: "Absolute",
          value: "#000000",
        },
      },
    })
  })

  it("imports full color appearance value form", () => {
    const result = testAtomicFromYAML({
      rule,
      value: {
        ЦветТекста: {
          Значение: "#FF0000",
        },
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
        value: {
          type: "Absolute",
          value: "#FF0000",
        },
      },
    })
  })

  it("imports double-quoted full color appearance value as color value", () => {
    const result = testAtomicFromYAML({
      rule,
      value: importFromYAML<{ ЦветТекста: { Значение: string } }>('ЦветТекста:\n  Значение: "#C0C0C0"'),
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
        value: {
          type: "Absolute",
          value: "#C0C0C0",
        },
      },
    })
  })

  it("keeps legacy compact color appearance readable", () => {
    const result = testAtomicFromYAML({
      rule,
      value: {
        ЦветТекста: "#FF0000",
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
        value: {
          type: "Absolute",
          value: "#FF0000",
        },
      },
    })
  })

  it("imports explicit DCS auto color marker", () => {
    const result = testAtomicFromYAML({
      rule,
      value: {
        ЦветТекста: "Авто",
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
      },
    })
  })

})
