import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { MetadataDocumentRules } from "./rules"
import { MetadataDocument } from "./types"

const importFixture = (fixture: string, forReference = false): MetadataDocument | undefined => {
  const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(import.meta.url, fixture)
  return importMetadataItemFromXML({
    context: mockContextFromXML({ forReference }),
    rule: MetadataDocumentRules,
    xml: parsed.MetaDataObject,
  }) as MetadataDocument | undefined
}

describe("MetadataDocument fromXML", () => {
  it("читает minimal.xml", () => {
    const result = importFixture("minimal.xml")

    expect(result).toBeDefined()
    expect(result?.name).toBe("ДокументПоУмолчанию")
    expect(result?.posting).toBe("Allow")
  })

  it("читает full.xml — основные свойства", () => {
    const result = importFixture("full.xml")

    expect(result?.name).toBe("ДокументВсеСвойства")
    expect(result?.posting).toBe("Allow")
    expect(result?.numberType).toBe("Number")
    expect(result?.attributes?.length).toBeGreaterThan(0)
  })
})
