import { describe, expect, it } from "vitest"
import {
  commonPicture,
  coommomPictureWithoutTransparent,
  standardPicture,
  standardPictureWithoutTransparent,
} from "~/tests/fixtures/picture/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPictureToXML } from "./exportToXML"

describe("exportPictureToXML", () => {
  it("should export standard picture to XML", () => {
    const expectedResult = readXMLFileAsString("picture/standart.xml")

    const result = { Picture: exportPictureToXML(mockСontext, standardPicture) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export common picture to XML", () => {
    const expectedResult = readXMLFileAsString("picture/common.xml")

    const result = { Picture: exportPictureToXML(mockСontext, commonPicture) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportPictureToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export common picture without transparent", () => {
    const expectedResult = readXMLFileAsString("picture/commonWithoutTransparent.xml")

    const result = { Picture: exportPictureToXML(mockСontext, coommomPictureWithoutTransparent) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export standard picture without transparent", () => {
    const expectedResult = readXMLFileAsString("picture/standartWithoutTransparent.xml")

    const result = { Picture: exportPictureToXML(mockСontext, standardPictureWithoutTransparent) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
