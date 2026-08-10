import { describe, expect, it } from "vitest"
import { colorTestCases } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
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

  it("should return undefined for XML auto color", () => {
    const result = importColorFromXML(mockContextFromXML(), mockRule, "auto")

    expect(result).toBeUndefined()
  })

  it.each(["0", "0:615512b6-4378-4fce-86f1-a56725f945da"])("should preserve raw XML color ref %s", (rawRef) => {
    const result = importColorFromXML(mockContextFromXML(), mockRule, rawRef)

    expect(result).toEqual({ rawRef })
  })
})
