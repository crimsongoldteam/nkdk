import { describe, expect, it } from "vitest"
import { pictureTestCases } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
import { importPictureFromXML } from "./fromXML"
import { PictureXML } from "./types"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

describe("importPictureFromXML", () => {
  it.each(pictureTestCases.filter(test => test.fixture !== undefined))("imports structural $name", ({ fixture, picture }) => {
    const xml = readXMLFixtureAsString(import.meta.url, fixture!.slice("picture/".length))
    expect(importPictureFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(picture)
  })

  it.each([
    ["<Picture/>", undefined],
    ["<Picture><xr:Ref>0</xr:Ref></Picture>", { rawRef: "0" }],
    ["<Picture><xr:Ref>0</xr:Ref><xr:LoadTransparent/></Picture>", { rawRef: "0" }],
    ['<Picture><xr:Ref>0</xr:Ref><xr:LoadTransparent>false</xr:LoadTransparent><xr:TransparentPixel x="12" y="2"/></Picture>', { rawRef: "0", loadTransparent: false, transparentPixel: { x: 12, y: 2 } }],
  ])("preserves structural picture presence: %s", (xml, expected) => {
    expect(importPictureFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toStrictEqual(expected)
  })

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

  it("should import empty raw ref from XML", () => {
    const rawRef = "0"
    const result = importPictureFromXML(mockContextFromXML(), mockRule, { "xr:Ref": rawRef })

    expect(result).toEqual({ rawRef })
  })

  it("should import raw ref with LoadTransparent=false from XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = importPictureFromXML(mockContextFromXML(), mockRule, {
      "xr:Ref": rawRef,
      "xr:LoadTransparent": false,
    })

    expect(result).toEqual({ rawRef, loadTransparent: false })
  })

  it("should import raw ref with LoadTransparent=true from XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = importPictureFromXML(mockContextFromXML(), mockRule, {
      "xr:Ref": rawRef,
      "xr:LoadTransparent": true,
    })

    expect(result).toEqual({ rawRef, loadTransparent: true })
  })

  it("should import raw ref with transparent pixel from XML", () => {
    const rawRef = "0"
    const result = importPictureFromXML(mockContextFromXML(), mockRule, {
      "xr:Ref": rawRef,
      "xr:LoadTransparent": true,
      "xr:TransparentPixel": { _x: "12", _y: "2" },
    })

    expect(result).toEqual({
      rawRef,
      loadTransparent: true,
      transparentPixel: { x: 12, y: 2 },
    })
  })

  it.each(["00", "0:g", "1:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"])(
    "should not classify %s as raw ref from XML",
    (ref) => {
      const result = importPictureFromXML(mockContextFromXML(), mockRule, { "xr:Ref": ref })

      expect(result).not.toEqual({ rawRef: ref })
    }
  )
})
