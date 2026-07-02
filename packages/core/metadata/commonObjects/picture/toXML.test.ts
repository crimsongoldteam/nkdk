import { describe, expect, it } from "vitest"
import { pictureTestCases } from "./__fixtures__/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { readXMLFileAsString } from "../../../tests/readAndParseXMLFile"
import { xmlExport } from "../../../xml/export/exporter"
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

  it("should export raw ref with LoadTransparent=false to XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = exportPictureToXML(mockContext, mockRule, { rawRef, loadTransparent: false })

    expect(result).toEqual({
      "xr:Ref": rawRef,
      "xr:LoadTransparent": false,
    })
  })

  it("should export raw ref with LoadTransparent=true to XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = exportPictureToXML(mockContext, mockRule, { rawRef, loadTransparent: true })

    expect(result).toEqual({
      "xr:Ref": rawRef,
      "xr:LoadTransparent": true,
    })
  })

  it("should export raw ref with transparent pixel to XML", () => {
    const rawRef = "0"
    const result = exportPictureToXML(mockContext, mockRule, {
      rawRef,
      loadTransparent: true,
      transparentPixel: { x: 12, y: 2 },
    })

    expect(result).toEqual({
      "xr:Ref": rawRef,
      "xr:LoadTransparent": true,
      "xr:TransparentPixel": { _x: 12, _y: 2 },
    })
  })
})
