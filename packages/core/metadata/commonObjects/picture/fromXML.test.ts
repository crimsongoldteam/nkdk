import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPictureFromXML } from "./fromXML"
import { PictureXML } from "./types"

describe("importPictureFromXML", () => {
  it.each(pictureTestCases.filter((tc) => tc.fixture))("should import $name from XML", ({ fixture, picture }) => {
    const xmlData = readAndParseXMLFile<{ Picture: PictureXML }>(fixture!)
    const result = importPictureFromXML(mockContextFromXML(), mockRule, xmlData.Picture)

    expect(result).toEqual(picture)
  })

  it("should return undefined for undefined input", () => {
    const result = importPictureFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import raw ref from XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = importPictureFromXML(mockContextFromXML(), mockRule, { "xr:Ref": rawRef })

    expect(result).toEqual({ rawRef })
  })
})
