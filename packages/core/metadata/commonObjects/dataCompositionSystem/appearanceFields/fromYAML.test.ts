import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testAtomicFromYAML } from "../../../../tests/property/atomicFromYAML"
import { exportToYAML } from "../../../../yaml/export"
import { importFromYAML } from "../../../../yaml/import"
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

  it("rejects the old explicit text type", () => {
    expect(() =>
      testAtomicFromYAML({
        rule,
        value: {
          Текст: {
            Тип: "МногоязычнаяСтрока",
            Значение: { ru: "Многоязычная строка" },
          },
        },
      })
    ).toThrow(/Текст и Формат не допускают поле Тип/)
  })

  it("imports explicit LocalStringType value for text appearance", () => {
    const result = testAtomicFromYAML({
      rule,
      value: {
        Текст: {
          ru: "Многоязычная строка",
        },
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        value: {
          items: { ru: "Многоязычная строка" },
        },
      },
    })
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

  it("imports explicit LocalFormattedStringType value for text appearance", () => {
    const result = testAtomicFromYAML({
      rule,
      value: {
        Текст: {
          Форматированный: "Истина",
          Текст: { ru: "Многоязычная форматированная строка" },
        },
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        value: {
          type: "LocalFormattedStringType",
          value: {
            formatted: true,
            items: { ru: "Многоязычная форматированная строка" },
          },
        },
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

  it("rejects expanded text appearance without value", () => {
    expect(() =>
      testAtomicFromYAML({
        rule,
        value: {
          Текст: {
            Использовать: "Ложь",
          },
        },
      })
    ).toThrow(/развёрнутая строка требует Значение/)
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

  it("imports null as an explicit nil text value", () => {
    const result = testAtomicFromYAML({
      rule,
      value: {
        Текст: null,
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        value: null,
      },
    })
  })
})
