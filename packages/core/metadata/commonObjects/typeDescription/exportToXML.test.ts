import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { typeFixturesTable } from "../../../tests/fixtures/typeDescription/data"
import { exportTypeDescriptionToXML } from "./exportToXML"
import { TypeDescriptionXML } from "./types"

describe("exportTypeDescriptionToXML", () => {
  it("should export undefined type description to XML", () => {
    const result = exportTypeDescriptionToXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should export type to XML: $internal.type", ({ internal, xml }) => {
    const result = exportTypeDescriptionToXML(mockСontext, internal)

    // Determine the XML wrapper based on the original XML structure
    const xmlData = importContentFromXML<{ TypeDescription?: TypeDescriptionXML; Type?: TypeDescriptionXML }>(xml)
    const wrapper = xmlData.TypeDescription ? { TypeDescription: result } : { Type: result }

    const xmlString = xmlExport(wrapper, false)
    const expectedXml = xml.trim()

    expect(xmlString).toEqual(expectedXml)
  })
})
