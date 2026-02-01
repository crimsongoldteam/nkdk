import { describe, expect, it } from "vitest"
import { multiple, single } from "~/tests/fixtures/metadataValueCollection/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataValueCollectionFromXML } from "./importFromXML"
import { MetadataValueCollectionXML } from "./types"

describe("importMetadataValueCollectionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataValueCollectionFromXML(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import with single value", () => {
    const xml = readAndParseXMLFile<{ BasedOn: MetadataValueCollectionXML }>("metadataValueCollection/single.xml")

    const result = importMetadataValueCollectionFromXML(mockContext, xml.BasedOn)
    expect(result).toEqual(single)
  })

  it("should import with multiple values", () => {
    const xml = readAndParseXMLFile<{ BasedOn: MetadataValueCollectionXML }>("metadataValueCollection/multiple.xml")

    const result = importMetadataValueCollectionFromXML(mockContext, xml.BasedOn)
    expect(result).toEqual(multiple)
  })
})
