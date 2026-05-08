import { describe, expect, it } from "vitest"
import { exportPropertyToXML, PropertyRule } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { xmlExport } from "~/xml/export/exporter"
import { explicitNullValueDCSParameters, fullDCSParameters, minimalDCSParameters } from "./__fixtures__/data"

const rule: PropertyRule = { type: "DCSParameters" }

const exportDCSParameters = (value: unknown, referenceMetadata?: unknown): string => {
  const xmlData = exportPropertyToXML({
    context: mockContextToXML(),
    rule,
    value,
    referenceMetadata,
  })

  return xmlExport({ Settings: xmlData }, false)
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

const parameterWithUndefinedTypeReference = {
  ...parameterWithoutValue,
  value: undefinedTypeReferenceValue,
} as const

describe("export DCSParameter to XML", () => {
  it("exports minimal.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalDCSParameters,
      xmlRootTag: "Settings",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullDCSParameters,
      xmlRootTag: "Settings",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports explicit null value as xsi:nil without reference", () => {
    const result = exportDCSParameters(explicitNullValueDCSParameters)
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
    const referenceMetadata = [
      {
        itemType: "DCSParameter" as const,
        name: "ПустоеЗначение",
        title: { items: { ru: "Пустое значение" } },
        value: undefined,
      },
    ]

    const result = exportDCSParameters(value, referenceMetadata)
    expect(result).toContain(`<dcssch:value xsi:nil="true"/>`)
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
    const referenceMetadata = [
      {
        itemType: "DCSParameter" as const,
        name: "ПустоеЗначение",
        title: { items: { ru: "Пустое значение" } },
        value: { type: "string" as const, value: "reference" },
      },
    ]

    const result = exportDCSParameters(value, referenceMetadata)

    expect(result).toContain(`<dcssch:value xsi:nil="true"/>`)
    expect(result).not.toContain("reference")
  })

  it("exports missing value from reference d6p1 Undefined", () => {
    const result = exportDCSParameters(
      [parameterWithoutValue],
      [parameterWithUndefinedTypeReference],
    )

    expect(result).toContain(
      '<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>',
    )
  })

  it("exports Parameter rule as array without wrapper", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule: { type: "DCSParameters", xml: "Parameter" },
      value: [parameterWithoutValue],
      referenceMetadata: [parameterWithUndefinedTypeReference],
    })

    expect(result).toEqual([
      expect.objectContaining({
        "dcssch:value": undefinedTypeReferenceValue,
      }),
    ])
  })

  it("exports explicit undefined value from reference d6p1 Undefined", () => {
    const result = exportDCSParameters(
      [{ ...parameterWithoutValue, value: undefined }],
      [parameterWithUndefinedTypeReference],
    )

    expect(result).toContain(
      '<dcssch:value xmlns:d6p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d6p1:Undefined</dcssch:value>',
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

    const result = exportDCSParameters(value, value)
    expect(result).not.toContain(`<dcssch:value`)
  })
})
