import { describe, expect, it } from "vitest"
import { fullButton, minimalButton } from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importButtonFromXML } from "./importFromXML"

describe("importButtonFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importButtonFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Button: any }>("forms/button/full.xml")

    const result = importButtonFromXML(mockContext, xmlData.Button)

    expect(result).toEqual(fullButton)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Button: any }>("forms/button/minimal.xml")

    const result = importButtonFromXML(mockContext, xmlData.Button)

    expect(result).toEqual(minimalButton)
  })
})
