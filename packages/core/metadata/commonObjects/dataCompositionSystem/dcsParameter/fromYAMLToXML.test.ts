import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import {
  explicitNullValueDCSParameters,
  explicitNullValueDCSParametersYAML,
  fullDCSParameters,
  minimalDCSParameters,
  minimalDCSParametersYAML,
  fullDCSParametersYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "DCSParameters" }

const exportDCSParameters = (value: unknown, yaml: unknown, referenceMetadata?: unknown): string => {
  return testExportPropertyModelThroughYAMLToXML({
    rule,
    value,
    yaml,
    referenceMetadata,
    xmlRootTag: "Settings",
  }).result
}

const undefinedTypeReferenceValue = {
  "_xmlns:d6p1": "http://v8.1c.ru/8.2/data/types",
  "_xsi:type": "v8:Type",
  "#text": "d6p1:Undefined",
} as const

const parameterWithoutValue = {
  itemType: "DCSParameter",
  name: "ТипЗначенияКлюча",
  title: { items: { ru: "Тип значения ключа" } },
} as const

const parameterXML = (name: string, ...values: unknown[]) => ({
  "dcssch:name": name,
  ...(values.length > 0 ? { "dcssch:value": values[0] } : {}),
})

describe("export DCSParameter to XML", () => {
  it("exports minimal.xml", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: minimalDCSParameters,
      yaml: minimalDCSParametersYAML,
      xmlRootTag: "Settings",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: fullDCSParameters,
      yaml: fullDCSParametersYAML,
      xmlRootTag: "Settings",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports explicit null value as xsi:nil without reference", () => {
    const result = exportDCSParameters(explicitNullValueDCSParameters, explicitNullValueDCSParametersYAML)
    expect(result).toContain(`<dcssch:value xsi:nil="true"/>`)
  })

  it("exports missing value as xsi:nil when reference item has value key", () => {
    const value = [
      {
        itemType: "DCSParameter" as const,
        name: "ПустоеЗначение",
        title: { items: { ru: "Пустое значение" } },
      },
    ]
    const referenceMetadata = [parameterXML("ПустоеЗначение", { "_xsi:nil": true })]

    const result = exportDCSParameters(value, { ПустоеЗначение: { Заголовок: "Пустое значение" } }, referenceMetadata)
    expect(result).toContain(`<dcssch:value xsi:nil="true"/>`)
  })

  it("exports multiple values", () => {
    const yaml = {
      ТипыНалогообложения: {
        Значение: [
          "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
          "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
        ],
      },
    }
    const result = exportDCSParameters([], yaml)

    expect(result).toContain(
      `<dcssch:value xsi:type="dcscor:DesignTimeValue">Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт</dcssch:value>`
    )
    expect(result).toContain(
      `<dcssch:value xsi:type="dcscor:DesignTimeValue">Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг</dcssch:value>`
    )
  })

  it("exports UUID parameter value according to valueType", () => {
    const result = exportDCSParameters([], {
      ИдентификаторПоиска: {
        ТипЗначения: "УникальныйИдентификатор",
        Значение: "00000000-0000-0000-0000-000000000000",
        ОграничениеИспользования: "Истина",
      },
    })

    expect(result).toContain('<dcssch:value xsi:type="v8:UUID">00000000-0000-0000-0000-000000000000</dcssch:value>')
    expect(result).not.toContain('xsi:type="xs:string"')
  })

  it("exports explicit undefined value as xsi:nil instead of reference value", () => {
    const value = [
      {
        itemType: "DCSParameter" as const,
        name: "ПустоеЗначение",
        title: { items: { ru: "Пустое значение" } },
        value: undefined,
      },
    ]
    const referenceMetadata = [parameterXML("ПустоеЗначение", { "_xsi:type": "xs:string", "#text": "reference" })]

    const result = exportDCSParameters(
      value,
      { ПустоеЗначение: { Заголовок: "Пустое значение", Значение: null } },
      referenceMetadata
    )

    expect(result).toContain(`<dcssch:value xsi:nil="true"/>`)
    expect(result).not.toContain("reference")
  })

  it("exports missing value from reference d6p1 Undefined", () => {
    const result = exportDCSParameters(
      [parameterWithoutValue],
      { ТипЗначенияКлюча: { Заголовок: "Тип значения ключа" } },
      [parameterXML("ТипЗначенияКлюча", undefinedTypeReferenceValue)]
    )

    expect(result).toContain(
      '<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>'
    )
  })

  it("does not use reference d6p1 Undefined from item with different name", () => {
    const result = exportDCSParameters(
      [{ ...parameterWithoutValue, name: "НовоеИмя" }],
      { НовоеИмя: { Заголовок: "Тип значения ключа" } },
      [parameterXML("СтароеИмя", undefinedTypeReferenceValue)]
    )

    expect(result).not.toContain("<dcssch:value")
  })

  it("does not use reference d6p1 Undefined with extra QName part", () => {
    const result = exportDCSParameters(
      [parameterWithoutValue],
      { ТипЗначенияКлюча: { Заголовок: "Тип значения ключа" } },
      [
        parameterXML("ТипЗначенияКлюча", {
          ...undefinedTypeReferenceValue,
          "#text": "d6p1:Undefined:extra",
        }),
      ]
    )

    expect(result).not.toContain("<dcssch:value")
  })

  it("exports Parameter rule as array without wrapper", () => {
    const result = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DCSParameters", xml: "Parameter" },
      value: [parameterWithoutValue],
      yaml: { ТипЗначенияКлюча: { Заголовок: "Тип значения ключа" } },
      referenceMetadata: [parameterXML("ТипЗначенияКлюча", undefinedTypeReferenceValue)],
      xmlRootTag: "Parameter",
    }).result

    expect(result).toContain(
      '<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>'
    )
  })

  it("exports explicit undefined value from reference d6p1 Undefined", () => {
    const result = exportDCSParameters(
      [{ ...parameterWithoutValue, value: undefined }],
      { ТипЗначенияКлюча: { Заголовок: "Тип значения ключа" } },
      [parameterXML("ТипЗначенияКлюча", undefinedTypeReferenceValue)]
    )

    expect(result).toContain(
      '<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>'
    )
  })

  it("omits missing value when neither model nor reference has value key", () => {
    const value = [
      {
        itemType: "DCSParameter" as const,
        name: "БезЗначения",
        title: { items: { ru: "Без значения" } },
      },
    ]

    const result = exportDCSParameters(value, { БезЗначения: { Заголовок: "Без значения" } }, [
      parameterXML("БезЗначения"),
    ])
    expect(result).not.toContain(`<dcssch:value`)
  })
})
