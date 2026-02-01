import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { fullTable, minimalTable } from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importTableFromXML } from "./importFromXML"
import { TableXML } from "./types"

describe("importTableFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importTableFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Table: TableXML }>("forms/table/full.xml")

    const result = importTableFromXML(mockContext, xmlData.Table)

    expect(result).toEqual(fullTable)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Table: TableXML }>("forms/table/minimal.xml")

    const result = importTableFromXML(mockContext, xmlData.Table)

    expect(result).toEqual(minimalTable)
  })
})
