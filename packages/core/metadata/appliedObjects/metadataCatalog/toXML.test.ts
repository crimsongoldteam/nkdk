import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataCatalogRules } from "./rules"
import { MetadataCatalog } from "./types"

const loadReference = (fixture: string): MetadataCatalog | undefined => {
  const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(import.meta.url, fixture)
  return importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: MetadataCatalogRules,
    xml: parsed.MetaDataObject,
  })
}

const exportFixture = (data: MetadataCatalog, fixture: string): string => {
  const xmlData = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    referenceData: loadReference(fixture),
    rule: MetadataCatalogRules,
  })
  return xmlExport(xmlData!)
}

describe("export MetadataCatalog to XML", () => {
  it("should export full.xml fixture", () => {
    const expected = readXMLFixtureAsString(import.meta.url, "full.xml")
    expect(exportFixture(full, "full.xml")).toEqual(expected)
  })

  it("should export minimal.xml fixture", () => {
    const expected = readXMLFixtureAsString(import.meta.url, "minimal.xml")
    expect(exportFixture(minimal, "minimal.xml")).toEqual(expected)
  })
})
