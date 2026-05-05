import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportTypeLinkToXML, exportTypeLinkWithXSITypeToXML } from "./toXML"
import { TypeLink } from "./types"

describe("exportTypeLinkToXML", () => {
  it("should export type link to XML", () => {
    const mockTypeLink: TypeLink = {
      dataPath: "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
      linkItem: 1,
    }

    const expectedResult = readXMLFileAsString("typeLink/simple.xml").trimEnd()

    const result = { TypeLink: exportTypeLinkToXML(mockContext, mockRule, mockTypeLink) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportTypeLinkToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})

describe("exportTypeLinkWithXSITypeToXML", () => {
  it("should export type link with xsi:type to XML", () => {
    const mockTypeLink: TypeLink = {
      dataPath: "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
      linkItem: 1,
    }

    const expectedResult = readXMLFileAsString("typeLink/withXSIType.xml").trimEnd()

    const result = { TypeLink: exportTypeLinkWithXSITypeToXML(mockContext, mockRule, mockTypeLink) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
