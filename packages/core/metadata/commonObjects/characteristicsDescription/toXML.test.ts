import { describe, expect, it } from "vitest"
import { multipleCharacteristics, singleCharacteristic } from "./__fixtures__/data"
import { importPropertyFromXML } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { mockContextFromXML } from "~/tests/mockContext"

const rule = { type: "CharacteristicsDescriptions" } as const

describe("export CharacteristicsDescriptions to XML", () => {
  it("should export single characteristic (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: singleCharacteristic,
      xmlRootTag: "Characteristics",
      path: "single.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export multiple characteristics (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: multipleCharacteristics,
      xmlRootTag: "Characteristics",
      path: "multiple.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("does not materialize missing XML default fields without reference tags", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: singleCharacteristic,
      xmlRootTag: "Characteristics",
      referenceMetadata: [
        {
          itemType: "CharacteristicsDescription",
          characteristicTypes: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
          keyField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
          characteristicValues: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
          objectField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
          typeField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
        },
      ],
    })

    expect(result).not.toContain("<xr:DataPathField>-1</xr:DataPathField>")
    expect(result).not.toContain("<xr:MultipleValuesUseField>-1</xr:MultipleValuesUseField>")
    expect(result).not.toContain("<xr:MultipleValuesKeyField>-1</xr:MultipleValuesKeyField>")
    expect(result).not.toContain("<xr:MultipleValuesOrderField>-1</xr:MultipleValuesOrderField>")
  })

  it("preserves explicit XML default fields from reference", () => {
    const referenceMetadata = importPropertyFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule,
      value: {
        "xr:Characteristic": {
          "xr:CharacteristicTypes": {
            _from: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
            "xr:KeyField": "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
            "xr:TypesFilterField": "-1",
            "xr:TypesFilterValue": { "_xsi:nil": true },
            "xr:DataPathField": "-1",
            "xr:MultipleValuesUseField": "-1",
          },
          "xr:CharacteristicValues": {
            _from: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
            "xr:ObjectField": "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
            "xr:TypeField": "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
            "xr:ValueField": "-1",
            "xr:MultipleValuesKeyField": "-1",
            "xr:MultipleValuesOrderField": "-1",
          },
        },
      },
    })

    const { result } = testExportPropertyToXML({
      rule,
      value: singleCharacteristic,
      xmlRootTag: "Characteristics",
      referenceMetadata,
    })

    expect(result).toContain("<xr:DataPathField>-1</xr:DataPathField>")
    expect(result).toContain("<xr:MultipleValuesUseField>-1</xr:MultipleValuesUseField>")
    expect(result).toContain("<xr:MultipleValuesKeyField>-1</xr:MultipleValuesKeyField>")
    expect(result).toContain("<xr:MultipleValuesOrderField>-1</xr:MultipleValuesOrderField>")
  })
})
