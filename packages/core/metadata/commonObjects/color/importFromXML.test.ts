import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importColorFromXML } from "./importFromXML"
import { ColorXML } from "./types"

describe("importColorFromXML", () => {
  it.each(colorTestCases.filter((testCase) => testCase.fixture))(
    "should import $name from XML",
    ({ fixture, color }) => {
      const xmlData = readAndParseXMLFile<{ Color: ColorXML }>(fixture!)
      const result = importColorFromXML(mockContext, xmlData.Color)

      expect(result).toEqual(color)
    }
  )

  it("should return undefined for undefined input", () => {
    const result = importColorFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })
})
