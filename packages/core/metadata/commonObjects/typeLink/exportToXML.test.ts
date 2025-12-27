import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportTypeLinkToXML } from "./exportToXML"
import { TypeLink } from "./types"

describe("exportTypeLinkToXML", () => {
  it("should export type link to XML", () => {
    const mockTypeLink: TypeLink = {
      dataPath: "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
      linkItem: 1,
    }

    const expectedResult = readXMLFileAsString("typeLink/simple.xml").trimEnd()

    const result = { TypeLink: exportTypeLinkToXML(mockСontext, mockTypeLink) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportTypeLinkToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
