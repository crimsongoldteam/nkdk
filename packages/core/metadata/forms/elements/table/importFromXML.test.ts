import { describe, expect, it } from "vitest"
import { fullTable, minimalTable } from "~/tests/fixtures/forms/table/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importTableFromXML } from "./importFromXML"
import { TableXML } from "./types"

describe("importTableFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importTableFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Table: TableXML }>("forms/table/full.xml")

    const result = importTableFromXML(mockСontext, xmlData.Table)

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Table: TableXML }>("forms/table/minimal.xml")

    const result = importTableFromXML(mockСontext, xmlData.Table)

    expect(result).toEqual(minimalTable)
  })
})

