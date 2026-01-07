import { describe, expect, it } from "vitest"
import { fullColumnGroup, minimalColumnGroup } from "~/tests/fixtures/forms/columnGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importColumnGroupFromXML } from "./importFromXML"
import { ColumnGroupXML } from "./types"

describe("importColumnGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importColumnGroupFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ColumnGroup: ColumnGroupXML }>("forms/columnGroup/full.xml")

    const result = importColumnGroupFromXML(mockСontext, xmlData.ColumnGroup)

    expect(result).toEqual(fullColumnGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ColumnGroup: ColumnGroupXML }>("forms/columnGroup/minimal.xml")

    const result = importColumnGroupFromXML(mockСontext, xmlData.ColumnGroup)

    expect(result).toEqual(minimalColumnGroup)
  })
})

