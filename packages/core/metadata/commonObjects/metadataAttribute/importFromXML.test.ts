import { describe, expect, it } from "vitest"
import { full, minimal, multiple } from "~/tests/fixtures/metadataAttribute/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataAttributesFromXML } from "./importFromXML"
import { MetadataAttributeXML } from "./types"

describe("importMetadataAttributeFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataAttributesFromXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/full.xml")

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/minimal.xml")

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(minimal)
  })

  it("should import defaults", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/defaults.xml")

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(minimal)
  })

  it("should import multiple attributes", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML[] }>("metadataAttribute/multiple.xml")

    const result = importMetadataAttributesFromXML(mockСontext, xmlData.Attribute)

    expect(result).toEqual(multiple)
  })
})
