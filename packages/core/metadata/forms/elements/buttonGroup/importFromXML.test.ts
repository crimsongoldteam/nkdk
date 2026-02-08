import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { ElementXML } from "~/metadata/metadataFactory"
import { fullButtonGroup, minimalButtonGroup } from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importButtonGroupFromXML } from "./importFromXML"

describe("importButtonGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importButtonGroupFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ButtonGroup: ElementXML }>("forms/buttonGroup/full.xml")

    const result = importButtonGroupFromXML(mockContext, xmlData.ButtonGroup)

    expect(result).toEqual(fullButtonGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ButtonGroup: ElementXML }>("forms/buttonGroup/minimal.xml")

    const result = importButtonGroupFromXML(mockContext, xmlData.ButtonGroup)

    expect(result).toEqual(minimalButtonGroup)
  })
})
