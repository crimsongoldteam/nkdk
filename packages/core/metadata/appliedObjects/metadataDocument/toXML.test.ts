import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { MetadataDocumentRules } from "./rules"
import { MetadataDocument } from "./types"

const loadFixture = (fixture: string): MetadataDocument | undefined => {
  const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(import.meta.url, fixture)
  return importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: MetadataDocumentRules,
    xml: parsed.MetaDataObject,
  })
}

const exportFixture = (data: MetadataDocument, fixture: string): string => {
  const xmlData = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    referenceData: loadFixture(fixture),
    rule: MetadataDocumentRules,
  })
  return xmlExport(xmlData!)
}

describe("export MetadataDocument to XML", () => {
  it("should export full.xml fixture", () => {
    const data = loadFixture("full.xml")
    expect(data).toBeDefined()
    const expected = readXMLFixtureAsString(import.meta.url, "full.xml")
    expect(exportFixture(data!, "full.xml")).toEqual(expected)
  })
})
