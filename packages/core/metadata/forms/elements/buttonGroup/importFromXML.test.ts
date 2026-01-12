import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { fullButtonGroup, minimalButtonGroup } from "~/tests/fixtures/forms/buttonGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importButtonGroupFromXML } from "./importFromXML"
import { ButtonGroupXML } from "./types"

describe("importButtonGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importButtonGroupFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ButtonGroup: ButtonGroupXML }>("forms/buttonGroup/full.xml")

    const result = importButtonGroupFromXML(mockСontext, xmlData.ButtonGroup)

    expect(result).toEqual(fullButtonGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ButtonGroup: ButtonGroupXML }>("forms/buttonGroup/minimal.xml")

    const result = importButtonGroupFromXML(mockСontext, xmlData.ButtonGroup)

    expect(result).toEqual(minimalButtonGroup)
  })
})
