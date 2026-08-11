import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importStyleItemValueFromXML } from "./fromXML"
import { StyleItemValueXML } from "./types"

const fontXML: StyleItemValueXML = {
  "_xsi:type": "v8ui:Font",
  _faceName: "Devanagari MT",
  _height: 16,
  _bold: true,
  _italic: true,
  _underline: true,
  _strikeout: true,
  _kind: "Absolute",
  _scale: 99,
}

const colorXML: StyleItemValueXML = {
  "_xsi:type": "v8ui:Color",
  "#text": "#8A31E2",
}

const borderXML: StyleItemValueXML = {
  "_xsi:type": "v8ui:Border",
  _width: 5,
  "v8ui:style": {
    "_xsi:type": "v8ui:ControlBorderType",
    "#text": "Overline",
  },
}

describe("importStyleItemValueFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importStyleItemValueFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import font style item value from XML", () => {
    const result = importStyleItemValueFromXML(mockContextFromXML(), mockRule, fontXML)

    expect(result).toEqual({
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
    })
  })

  it("should import color style item value from XML", () => {
    const result = importStyleItemValueFromXML(mockContextFromXML(), mockRule, colorXML)

    expect(result).toEqual({
      type: "Color",
      value: { type: "Absolute", value: "#8A31E2" },
    })
  })

  it("should import border style item value from XML", () => {
    const result = importStyleItemValueFromXML(mockContextFromXML(), mockRule, borderXML)

    expect(result).toEqual({
      type: "Border",
      value: { width: 5, controlBorderType: "Overline" },
    })
  })
})
