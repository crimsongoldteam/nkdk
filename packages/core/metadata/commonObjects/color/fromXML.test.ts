import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importColorFromXML } from "./fromXML"
import { ColorXML } from "./types"

describe("importColorFromXML", () => {
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
})
