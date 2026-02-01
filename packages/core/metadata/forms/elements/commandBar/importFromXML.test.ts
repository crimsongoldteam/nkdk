import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { fullCommandBar, minimalCommandBar } from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importCommandBarFromXML } from "./importFromXML"
import { CommandBarXML } from "./types"

describe("importCommandBarFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandBarFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ CommandBar: CommandBarXML }>("forms/commandBar/full.xml")

    const result = importCommandBarFromXML(mockContext, xmlData.CommandBar)

    expect(result).toEqual(fullCommandBar)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ CommandBar: CommandBarXML }>("forms/commandBar/minimal.xml")

    const result = importCommandBarFromXML(mockContext, xmlData.CommandBar)

    expect(result).toEqual(minimalCommandBar)
  })
})
