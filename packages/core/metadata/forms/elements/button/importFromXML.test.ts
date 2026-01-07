import { describe, expect, it } from "vitest"
import { fullButton, minimalButton } from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importButtonFromXML } from "./importFromXML"
import { ButtonXML } from "./types"

describe("importButtonFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importButtonFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Button: ButtonXML }>("forms/button/full.xml")

    const result = importButtonFromXML(mockСontext, xmlData.Button)

    expect(result).toEqual(fullButton)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Button: ButtonXML }>("forms/button/minimal.xml")

    const result = importButtonFromXML(mockСontext, xmlData.Button)

    expect(result).toEqual(minimalButton)
  })
})
