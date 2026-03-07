import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullPictureField, minimalPictureField } from "~/tests/fixtures/forms/pictureField/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPictureFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/pictureField/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullPictureField })

    const result = xmlExport({ PictureField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/pictureField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalPictureField })

    const result = xmlExport({ PictureField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
