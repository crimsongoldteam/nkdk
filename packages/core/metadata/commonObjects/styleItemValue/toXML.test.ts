import { describe, expect, it } from "vitest"
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { exportStyleItemValueToXML } from "./toXML"
import { StyleItemValue } from "./types"

const fontValue: StyleItemValue = {
  type: "Font",
  value: {
    faceName: "Devanagari MT",
    height: 16,
    bold: true,
    italic: true,
    underline: true,
    strikeout: true,
    kind: "Absolute",
    scale: 99,
  },
}

const colorValue: StyleItemValue = {
  type: "Color",
  value: { type: "Absolute", value: "#8A31E2" },
}

const borderValue: StyleItemValue = {
  type: "Border",
  value: { width: 5, controlBorderType: "Overline" },
}

describe("exportStyleItemValueToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportStyleItemValueToXML(mockContextToXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export font style item value to XML", () => {
    const result = exportStyleItemValueToXML(mockContextToXML(), mockRule, fontValue)

    expect(result).toEqual({
      "_xsi:type": "v8ui:Font",
      _faceName: "Devanagari MT",
      _height: 16,
      _bold: true,
      _italic: true,
      _underline: true,
      _strikeout: true,
      _kind: "Absolute",
      _scale: 99,
    })
  })

  it("should export color style item value to XML", () => {
    const result = exportStyleItemValueToXML(mockContextToXML(), mockRule, colorValue)

    expect(result).toEqual({
      "_xsi:type": "v8ui:Color",
      "#text": "#8A31E2",
    })
  })

  it("should export border style item value to XML", () => {
    const result = exportStyleItemValueToXML(mockContextToXML(), mockRule, borderValue)

    expect(result).toEqual({
      "_xsi:type": "v8ui:Border",
      _width: 5,
      "v8ui:style": {
        "_xsi:type": "v8ui:ControlBorderType",
        "#text": "Overline",
      },
    })
  })
})
