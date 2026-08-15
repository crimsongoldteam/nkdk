import { describe, expect, it } from "vitest"
import { colorTestCases } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
import { importColorFromXML } from "./fromXML"
import { ColorXML } from "./types"
import { colorStyleItemTarget } from "./types"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { testPropertyFromXMLToYAML } from "../../../tests/directConversion"

describe("importColorFromXML", () => {
  it("не применяет общий metadataTarget поверх предметного преобразования цвета", () => {
    const rule = {
      itemType: "ColorMetadataTargetProbe",
      properties: {
        color: {
          type: "Color",
          yaml: "Цвет",
          xml: "Color",
          metadataTarget: colorStyleItemTarget,
        },
      },
    } as const satisfies MetadataItemRule

    expect(testPropertyFromXMLToYAML({
      rule,
      xml: { Color: "style:SpecialTextColor" },
    }).yaml).toEqual({ Цвет: "ЦветОсобогоТекста" })
  })

  it.each(colorTestCases.filter((testCase) => testCase.fixture))(
    "should import $name from XML",
    ({ fixture, color }) => {
      const xmlData = readAndParseXMLFile<{ Color: ColorXML }>(fixture!)
      const result = importColorFromXML(mockContextFromXML(), mockRule, xmlData.Color)

      expect(result).toEqual(color)
    }
  )

  it("should return undefined for undefined input", () => {
    const result = importColorFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined for XML auto color", () => {
    const result = importColorFromXML(mockContextFromXML(), mockRule, "auto")

    expect(result).toBeUndefined()
  })

  it.each(["0", "0:615512b6-4378-4fce-86f1-a56725f945da"])("should preserve raw XML color ref %s", (rawRef) => {
    const result = importColorFromXML(mockContextFromXML(), mockRule, rawRef)

    expect(result).toEqual({ rawRef })
  })
})
