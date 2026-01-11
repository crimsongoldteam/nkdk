import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { fullAutoCommandBar, parentElement } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importAutoCommandBarFromXML } from "./importFromXML"
import { AutoCommandBarXML } from "./types"

describe("importAutoCommandBarFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ AutoCommandBar: AutoCommandBarXML }>("forms/autoCommandBar/full.xml")

    const result = importAutoCommandBarFromXML(mockСontext, xmlData.AutoCommandBar, parentElement)

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ AutoCommandBar: AutoCommandBarXML }>("forms/autoCommandBar/minimal.xml")

    const result = importAutoCommandBarFromXML(mockСontext, xmlData.AutoCommandBar, parentElement)

    expect(result).toBeUndefined()
  })
})
