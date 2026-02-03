import { describe, expect, it } from "vitest"
import { fullButton, minimalButton } from "~/tests/fixtures/forms/button/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importButtonFromXML } from "./importFromXML"
import { ButtonXML } from "./types"

describe("importButtonFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importButtonFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Button: ButtonXML }>("forms/button/full.xml")

    const result = importButtonFromXML(mockContext, mockRule, xmlData.Button)

    expect(result).toEqual(fullButton)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Button: ButtonXML }>("forms/button/minimal.xml")

    const result = importButtonFromXML(mockContext, mockRule, xmlData.Button)

    expect(result).toEqual(minimalButton)
  })
})
