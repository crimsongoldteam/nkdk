import { describe, expect, it } from "vitest"
import { all, minimal, multiple } from "~/metadata/commonObjects/standardAttributeDescription/__fixtures__/data"
import { fillValueEmptyRefTypeLoss } from "~/metadata/commonObjects/standardAttributeDescription/__fixtures__/fillValueEmptyRefTypeLoss"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { StandardAttributeDescriptionRules } from "./rules"

describe("exportStandardAttributeDescriptionsToXML", () => {
  it("exports all.xml fixture", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: {
        PredefinedDataName: "ИмяПредопределенныхДанных",
        Predefined: "Предопределенный",
        Ref: "Ссылка",
        DeletionMark: "ПометкаУдаления",
        IsFolder: "ЭтоГруппа",
        Owner: "Владелец",
        Parent: "Родитель",
        Description: "Наименование",
        Code: "Код",
      },
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: all,
      xmlRootTag: "StandardAttributes",
      path: "all.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports multiple.xml fixture", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: { PredefinedDataName: "ИмяПредопределенныхДанных", Predefined: "Предопределенный" },
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: multiple,
      xmlRootTag: "StandardAttributes",
      path: "multiple.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports minimal.xml fixture", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: { PredefinedDataName: "ИмяПредопределенныхДанных" },
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimal,
      xmlRootTag: "StandardAttributes",
      path: "default.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports RecordType when it is part of standard attribute names", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: {
        RecordType: "ВидДвижения",
        Active: "Активность",
      },
    }
    const { result } = testExportPropertyToXML({
      rule,
      value: [{ itemType: "StandardAttributeDescription", name: "Active", comment: "changed" }],
      xmlRootTag: "StandardAttributes",
    })

    expect(result).toContain('<xr:StandardAttribute name="RecordType">')
    expect(result).toContain('<xr:StandardAttribute name="Active">')
    expect(result.indexOf('name="RecordType"')).toBeLessThan(result.indexOf('name="Active"'))
  })

  it("exports undefined", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: { PredefinedDataName: "ИмяПредопределенныхДанных" },
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag: "StandardAttributes",
      path: "default.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("export fillValueEmptyRefTypeLoss", () => {
    const rule: PropertyRule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: { Ref: "Ссылка" },
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fillValueEmptyRefTypeLoss,
      xmlRootTag: "StandardAttributes",
      path: "fillValueEmptyRefTypeLoss.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("preserves maxValue xsi type from reference", () => {
    const { result } = testExportPropertyToXML({
      rule: StandardAttributeDescriptionRules.properties.maxValue,
      value: 99.99,
      referenceMetadata: testImportPropertyFromXML({
        rule: StandardAttributeDescriptionRules.properties.maxValue,
        xmlString: '<xr:MaxValue xsi:type="xs:decimal">99.99</xr:MaxValue>',
        xmlRootTag: "xr:MaxValue",
        forReference: true,
      }),
      xmlRootTag: "xr:MaxValue",
    })

    expect(result).toBe('<xr:MaxValue xsi:type="xs:decimal">99.99</xr:MaxValue>')
  })

  it("preserves fillValue reference xsi type for missing value", () => {
    const { result } = testExportPropertyToXML({
      rule: StandardAttributeDescriptionRules.properties.fillValue,
      value: undefined,
      referenceMetadata: testImportPropertyFromXML({
        rule: StandardAttributeDescriptionRules.properties.fillValue,
        xmlString: '<xr:FillValue xsi:type="v8:TypeDescription"/>',
        xmlRootTag: "xr:FillValue",
        forReference: true,
      }),
      xmlRootTag: "xr:FillValue",
    })

    expect(result).toBe('<xr:FillValue xsi:type="v8:TypeDescription"/>')
  })
})
