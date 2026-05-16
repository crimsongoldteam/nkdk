import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPictureToXML } from "./toXML"

describe("exportPictureToXML", () => {
  it.each(pictureTestCases.filter((tc) => tc.fixture))("should export $name to XML", ({ picture, fixture }) => {
    const expectedResult = readXMLFileAsString(fixture!)

    const result = { Picture: exportPictureToXML(mockContext, mockRule, picture) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportPictureToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export raw ref to XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = exportPictureToXML(mockContext, mockRule, { rawRef })

    expect(result?.["xr:Ref"]).toBe(rawRef)
  })

  it("should export empty raw ref to XML", () => {
    const rawRef = "0"
    const result = exportPictureToXML(mockContext, mockRule, { rawRef })

    expect(result?.["xr:Ref"]).toBe(rawRef)
  })
})
