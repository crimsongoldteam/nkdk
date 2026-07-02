import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "./__fixtures__/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { xmlExport } from "../../../xml/export/exporter"
import { exportFontToXML } from "./toXML"

describe("exportFontToXML", () => {
  it.each(fontYAMLFixtures)("should export $name font to XML", ({ font, xml }) => {
    const result = { Font: exportFontToXML(mockContext, mockRule, font) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(xml)
  })

  it("should return undefined for undefined input", () => {
    const result = exportFontToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("exports raw non-prefixed style item ref", () => {
    const result = {
      Font: exportFontToXML(mockContext, mockRule, {
        ref: "0" as never,
        kind: "StyleItem",
        height: 10,
        rawRef: true,
      }),
    }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual('<Font ref="0" height="10" kind="StyleItem"/>')
  })
})
