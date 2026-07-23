import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testAtomicFromYAML } from "../../../../tests/property/atomicFromYAML"
import { exportToYAML } from "../../../../yaml/export"
import { importFromYAML } from "../../../../yaml/import"
import { parameterValueFixtures } from "./__fixtures__/data"
import "./fromYAML"

describe("importParameterValueFromYAML (через callAtomicFromYAML)", () => {
  const parseViaYamlText = <T>(value: T): T => importFromYAML<T>(exportToYAML(value))

  it.each(parameterValueFixtures)("imports $title", (fixture) => {
    const result = testAtomicFromYAML({
      rule: fixture.rule as PropertyRule,
      value: fixture.yaml,
    })
    expect(result).toEqual(fixture.value)
  })

  it("imports wrapper whose name matches a Font YAML key for non-Font values", () => {
    const result = testAtomicFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue" } as PropertyRule,
      value: {
        Имя: "Значение",
      },
    })

    expect(result).toEqual({
      parameter: "Имя",
      value: { type: "string", value: "Значение" },
    })
  })

  it("imports expanded use-only SettingsParameterValue without treating it as value", () => {
    const result = testAtomicFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
      value: {
        Использовать: "Ложь",
      },
    })

    expect(result).toEqual({
      parameter: "Текст",
      use: false,
    })
  })

  it("imports full color value form without passing wrapper to Color importer", () => {
    const result = testAtomicFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" } as PropertyRule,
      value: {
        Значение: "#FF0000",
      },
    })

    expect(result).toEqual({
      parameter: "ЦветТекста",
      value: {
        type: "Absolute",
        value: "#FF0000",
      },
    })
  })

  it("imports disabled full color value form", () => {
    const result = testAtomicFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" } as PropertyRule,
      value: {
        Использовать: "Ложь",
        Значение: "#FF0000",
      },
    })

    expect(result).toEqual({
      parameter: "ЦветТекста",
      use: false,
      value: {
        type: "Absolute",
        value: "#FF0000",
      },
    })
  })

  it("keeps legacy explicit DCS object value readable as compact value", () => {
    const result = testAtomicFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
      value: {
        Тип: "Поле",
        Значение: "Сертификаты.СертификатПредставление",
      },
    })

    expect(result).toEqual({
      parameter: "Текст",
      value: {
        type: "Field",
        value: "Сертификаты.СертификатПредставление",
      },
    })
  })

  it("imports object DCS value from full wrapper without flattening inner object", () => {
    const result = testAtomicFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
      value: {
        Значение: {
          Тип: "Поле",
          Значение: "Сертификаты.СертификатПредставление",
        },
      },
    })

    expect(result).toEqual({
      parameter: "Текст",
      value: {
        type: "Field",
        value: "Сертификаты.СертификатПредставление",
      },
    })
  })

  it("imports explicit empty string value in field context", () => {
    const result = testAtomicFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Field", yaml: "НоменклатураВключение" } as PropertyRule,
      value: {
        Использовать: "Ложь",
        Значение: {
          Тип: "Строка",
          Значение: "",
        },
      },
    })

    expect(result).toEqual({
      parameter: "НоменклатураВключение",
      use: false,
      value: { type: "string", value: "" },
    })
  })

  it("does not import explicit string wrapper as primitive string outside field context", () => {
    expect(() =>
      testAtomicFromYAML({
        rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
        value: {
          Использовать: "Ложь",
          Значение: {
            Тип: "Строка",
            Значение: "",
          },
        },
      })
    ).toThrow("MetadataDcsMetadataValue YAML: invalid explicit text value")
  })

  it("imports double-quoted numeric-looking primitive value as string", () => {
    const yaml = parseViaYamlText({
      Значение: "123",
    })

    const result = testAtomicFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Маска" } as PropertyRule,
      value: yaml,
    })

    expect(result).toEqual({
      parameter: "Маска",
      value: { type: "string", value: "123" },
    })
  })

  it("imports double-quoted numeric-looking primitive array item as string", () => {
    const yaml = parseViaYamlText({
      Значение: ["123", 456],
    })

    const result = testAtomicFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Список" } as PropertyRule,
      value: yaml,
    })

    expect(result).toEqual({
      parameter: "Список",
      value: [
        { type: "string", value: "123" },
        { type: "decimal", value: 456 },
      ],
    })
  })
})
