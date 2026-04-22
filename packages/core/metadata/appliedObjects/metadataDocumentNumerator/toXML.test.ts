import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML } from "~/metadata/orchestration"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataDocumentNumeratorRules } from "./rules"
import { MetadataDocumentNumerator } from "./types"

const loadReference = (fixture: string): MetadataDocumentNumerator | undefined => {
  const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(import.meta.url, fixture)
  return importPropertyFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: { type: "MetadataDocumentNumerator" } as const,
    value: parsed.MetaDataObject,
  }) as MetadataDocumentNumerator | undefined
}

const exportFixture = (data: MetadataDocumentNumerator, fixture: string): string => {
  const xmlData = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    referenceData: loadReference(fixture),
    rule: MetadataDocumentNumeratorRules,
  })
  return xmlExport(xmlData!)
}

describe("export MetadataDocumentNumerator to XML", () => {
  it("should export full.xml fixture", () => {
    const expected = readXMLFixtureAsString(import.meta.url, "full.xml")
    expect(exportFixture(full, "full.xml")).toEqual(expected)
  })

  it("should export minimal.xml fixture", () => {
    const expected = readXMLFixtureAsString(import.meta.url, "minimal.xml")
    expect(exportFixture(minimal, "minimal.xml")).toEqual(expected)
  })
})
