import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullButtonGroup, minimalButtonGroup } from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importButtonGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: "ButtonGroup",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ButtonGroup: ElementXML }>("forms/buttonGroup/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "ButtonGroup",
      xml: xmlData.ButtonGroup,
    })

    expect(result).toEqual(fullButtonGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ButtonGroup: ElementXML }>("forms/buttonGroup/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: "ButtonGroup",
      xml: xmlData.ButtonGroup,
    })

    expect(result).toEqual(minimalButtonGroup)
  })
})
