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

const rule = { type: "MetadataDocumentNumerator" } as const

const importFixture = (fixture: string, forReference = false): MetadataDocumentNumerator | undefined => {
  const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(import.meta.url, fixture)
  return importPropertyFromXML({
    context: mockContextFromXML({ forReference }),
    rule,
    value: parsed.MetaDataObject,
  }) as MetadataDocumentNumerator | undefined
}

describe("import MetadataDocumentNumerator from XML", () => {
  it("should import full", () => {
    expect(importFixture("full.xml")).toEqual(full)
  })

  it("should import minimal", () => {
    expect(importFixture("minimal.xml")).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const source = readXMLFixtureAsString(import.meta.url, fixture)
      const data = importFixture(fixture)
      const referenceData = importFixture(fixture, true)

      const xmlData = exportMetadataItemToXML({
        context: mockContextToXML(),
        data,
        referenceData,
        rule: MetadataDocumentNumeratorRules,
      })

      const exported = xmlExport(xmlData!)

      expect(exported).toEqual(source)
    }
  )
})
