import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { readXMLFixtureAsString } from "../../tests/readFixtureXML"
import { xmlExport } from "../../xml/export/exporter"
import { SystemEnumerationPropertyRule } from "./types"
import { exportSystemEnumerationToDcsXML } from "./toDcsXML"

describe("exportSystemEnumerationToDcsXML", () => {
  it("should export HorizontalAlign to DCS fragment", () => {
    const rule = {
      type: "SystemEnumeration",
      typeSE: "HorizontalAlign",
    } as SystemEnumerationPropertyRule

    const expectedResult = readXMLFixtureAsString(import.meta.url, "dcs/horizontalAlign.xml")

    const exported = exportSystemEnumerationToDcsXML(mockContext, rule, "Center")
    const xmlString = xmlExport(exported!, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined when value is undefined", () => {
    const rule = {
      type: "SystemEnumeration",
      typeSE: "HorizontalAlign",
    } as SystemEnumerationPropertyRule

    expect(exportSystemEnumerationToDcsXML(mockContext, rule, undefined)).toBeUndefined()
  })
})
