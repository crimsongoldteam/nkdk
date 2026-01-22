import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPictureToXML } from "./exportToXML"

describe("exportPictureToXML", () => {
  it.each(pictureTestCases.filter((tc) => tc.fixture))(
    "should export $name to XML",
    ({ picture, fixture }) => {
      const expectedResult = readXMLFileAsString(fixture!)

      const result = { Picture: exportPictureToXML(mockСontext, picture) }
      const xmlString = xmlExport(result, false)

      expect(xmlString).toEqual(expectedResult)
    }
  )

  it("should return undefined for undefined input", () => {
    const result = exportPictureToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
