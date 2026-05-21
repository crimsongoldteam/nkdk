import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { dcsMetadataValueXMLFixtures } from "./__fixtures__/data"
import { exportDcsMetadataValueToXML } from "./toXML"

describe("export MetadataDcsMetadataValue to XML", () => {
  it.each(dcsMetadataValueXMLFixtures)("exports $title", (fixture) => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: fixture.rule,
      value: fixture.value,
      xmlRootTag: "dcscor:value",
      importMetaUrl: import.meta.url,
      path: fixture.xml,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports explicit DesignTimeValue field as dcscor:Field", () => {
    expect(
      exportDcsMetadataValueToXML(
        mockContextToXML(),
        { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        { type: "Field", value: "СписокФайлов.ФормаРСВ_Представление" }
      )
    ).toEqual({
      "_xsi:type": "dcscor:Field",
      "#text": "СписокФайлов.ФормаРСВ_Представление",
    })
  })

  it("exports preserved empty LocalStringType as empty typed XML", () => {
    expect(
      exportDcsMetadataValueToXML(
        mockContextToXML(),
        { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        { items: {} }
      )
    ).toEqual({
      "_xsi:type": "v8:LocalStringType",
    })
  })
})
