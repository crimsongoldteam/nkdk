import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullColumnGroup, minimalColumnGroup } from "~/tests/fixtures/forms/columnGroup/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importColumnGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: "ColumnGroup",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ColumnGroup: ElementXML }>("forms/columnGroup/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "ColumnGroup",
      xml: xmlData.ColumnGroup,
    })

    expect(result).toEqual(fullColumnGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ColumnGroup: ElementXML }>("forms/columnGroup/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "ColumnGroup",
      xml: xmlData.ColumnGroup,
    })

    expect(result).toEqual(minimalColumnGroup)
  })
})
