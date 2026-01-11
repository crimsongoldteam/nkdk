import { describe, expect, it } from "vitest"
import { fullAutoCommandBar, minimalAutoCommandBar } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importAutoCommandBarFromXML } from "./importFromXML"
import { AutoCommandBarXML } from "./types"

describe("importAutoCommandBarFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importAutoCommandBarFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ CommandBar: AutoCommandBarXML }>("forms/commandBar/full.xml")

    const result = importAutoCommandBarFromXML(mockСontext, xmlData.CommandBar)

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ CommandBar: AutoCommandBarXML }>("forms/commandBar/minimal.xml")

    const result = importAutoCommandBarFromXML(mockСontext, xmlData.CommandBar)

    expect(result).toEqual(minimalAutoCommandBar)
  })
})
