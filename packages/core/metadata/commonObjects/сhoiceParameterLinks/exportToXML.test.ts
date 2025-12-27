import { describe, expect, it } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "~/packages/core/tests/readAndParseXMLFile"
import { xmlExport } from "~/packages/core/xml/export/exporter"
import { exportChoiceParameterLinksToXML } from "./exportToXML"
import { importChoiceParameterLinksFromXML } from "./importFromXML"
import { ChoiceParameterLinksXML } from "./types"

describe("exportChoiceParameterLinksToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParameterLinksToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import choice parameter links with single link correctly (round-trip)", () => {
    const originalXml = readXMLFileAsString("сhoiceParameterLinks/exportSingle.xml").trimEnd()

    const xml = readAndParseXMLFile<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      "сhoiceParameterLinks/exportSingle.xml"
    )
    const imported = importChoiceParameterLinksFromXML(mockСontext, xml.ChoiceParameterLinks)
    const exported = exportChoiceParameterLinksToXML(mockСontext, imported)
    const resultXml = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })

  it("should export and import choice parameter links with multiple links correctly (round-trip)", () => {
    const originalXml = readXMLFileAsString("сhoiceParameterLinks/exportMultiple.xml").trimEnd()

    const xml = readAndParseXMLFile<{ ChoiceParameterLinks: ChoiceParameterLinksXML }>(
      "сhoiceParameterLinks/exportMultiple.xml"
    )
    const imported = importChoiceParameterLinksFromXML(mockСontext, xml.ChoiceParameterLinks)
    const exported = exportChoiceParameterLinksToXML(mockСontext, imported)
    const resultXml = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
