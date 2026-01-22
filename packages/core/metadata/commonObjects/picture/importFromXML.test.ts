import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPictureFromXML } from "./importFromXML"
import { PictureXML } from "./types"

describe("importPictureFromXML", () => {
  it.each(pictureTestCases.filter((tc) => tc.fixture))(
    "should import $name from XML",
    ({ fixture, picture }) => {
      const xmlData = readAndParseXMLFile<{ Picture: PictureXML }>(fixture!)
      const result = importPictureFromXML(mockСontext, xmlData.Picture)

      expect(result).toEqual(picture)
    }
  )

  it("should return undefined for undefined input", () => {
    const result = importPictureFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
