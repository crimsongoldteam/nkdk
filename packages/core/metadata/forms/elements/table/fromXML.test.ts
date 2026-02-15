import { describe, expect, it } from "vitest"
import { CollectionFormElementType, ElementXML, importElementFromXML } from "~/metadata/metadataFactory"
import { fullTable, minimalTable } from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importTableFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.Table,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Table: ElementXML }>("forms/table/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.Table,
      xml: xmlData.Table,
    })

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Table: ElementXML }>("forms/table/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.Table,
      xml: xmlData.Table,
    })

    expect(result).toEqual(minimalTable)
  })
})
