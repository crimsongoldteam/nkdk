import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { fullAutoCommandBar } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importAutoCommandBarFromXML } from "./importFromXML"
import { AutoCommandBarXML } from "./types"

describe("importAutoCommandBarFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ AutoCommandBar: AutoCommandBarXML }>("forms/autoCommandBar/fullForm.xml")

    const result = importAutoCommandBarFromXML(mockContext, xmlData.AutoCommandBar)

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ AutoCommandBar: AutoCommandBarXML }>("forms/autoCommandBar/minimalForm.xml")

    const result = importAutoCommandBarFromXML(mockContext, xmlData.AutoCommandBar)

    expect(result).toBeUndefined()
  })
})
