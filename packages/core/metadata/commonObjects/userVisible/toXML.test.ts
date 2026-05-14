import { describe, expect, it } from "vitest"
import { withMultipleValuesUserVisible } from "~/tests/fixtures/userVisible/withMultipleValues"
import { withSingleValueUserVisible } from "~/tests/fixtures/userVisible/withSingleValue"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportUserVisibleToXML } from "./toXML"
import { UserVisible } from "./types"

describe("exportUserVisibleToXML", () => {
  it("should export UserVisible to XML", () => {
    const mockUserVisible = withMultipleValuesUserVisible

    const expectedResult = readXMLFileAsString("userVisible/withMultipleValues.xml").trimEnd()

    const exported = exportUserVisibleToXML(mockContext, mockRule, mockUserVisible)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export UserVisible to XML with empty values", () => {
    const mockUserVisible: UserVisible = {
      common: false,
      values: [],
    }

    const expectedResult = `<UserVisible>
	<xr:Common>false</xr:Common>
</UserVisible>`

    const exported = exportUserVisibleToXML(mockContext, mockRule, mockUserVisible)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportUserVisibleToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should handle single value in UserVisible", () => {
    const mockUserVisible = withSingleValueUserVisible

    const expectedResult = readXMLFileAsString("userVisible/withSingleValue.xml").trimEnd()

    const exported = exportUserVisibleToXML(mockContext, mockRule, mockUserVisible)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("exports Role-prefixed names and UUID names exactly", () => {
    const mockUserVisible: UserVisible = {
      common: false,
      values: [
        { name: "Role.ПолныеПрава", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true },
      ],
    }

    const exported = exportUserVisibleToXML(mockContext, mockRule, mockUserVisible)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(`<UserVisible>
	<xr:Common>false</xr:Common>
	<xr:Value name="Role.ПолныеПрава">true</xr:Value>
	<xr:Value name="b1d9c8b4-d05c-45c7-8db2-abc84e597700">true</xr:Value>
</UserVisible>`)
  })
})
