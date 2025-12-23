import { describe, expect, it } from "vitest"
import { withMultipleValuesUserVisible } from "~/lib/tests/fixtures/userVisible/withMultipleValues"
import { mockcontext } from "~/lib/tests/mockContext"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importUserVisibleFromXML } from "./importFromXML"
import { UserVisible, UserVisibleXML } from "./types"

describe("importUserVisibleFromXML", () => {
  it("should import Use from XML", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withMultipleValues.xml")

    const result = importUserVisibleFromXML(mockcontext, xml.UserVisible)

    expect(result).toEqual(withMultipleValuesUserVisible)
  })

  it("should import Use from XML with empty values", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withEmptyValues.xml")

    const expectedResult: UserVisible = {
      common: false,
      values: [],
    }

    const result = importUserVisibleFromXML(mockcontext, xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = importUserVisibleFromXML(mockcontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should handle single value in Use XML", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withMultipleValues.xml")

    const expectedResult = withMultipleValuesUserVisible

    const result = importUserVisibleFromXML(mockcontext, xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })
})
