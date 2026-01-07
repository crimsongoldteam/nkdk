import { describe, expect, it } from "vitest"
import { fullPictureField, minimalPictureField } from "~/tests/fixtures/forms/pictureField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPictureFieldToXML } from "./exportToXML"

describe("exportPictureFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPictureFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/pictureField/full.xml")
    const xmlData = exportPictureFieldToXML(mockСontext, fullPictureField)

    const result = xmlExport({ PictureField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/pictureField/minimal.xml")
    const xmlData = exportPictureFieldToXML(mockСontext, minimalPictureField)

    const result = xmlExport({ PictureField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

