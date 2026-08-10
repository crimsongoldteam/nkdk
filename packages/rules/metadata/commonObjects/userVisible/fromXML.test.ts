import { describe, expect, it } from "vitest"
import { withMultipleValuesUserVisible } from "./__fixtures__/withMultipleValues"
import { withSingleValueUserVisible } from "./__fixtures__/withSingleValue"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
import { importUserVisibleFromXML } from "./fromXML"
import { UserVisible, UserVisibleXML } from "./types"

describe("importUserVisibleFromXML", () => {
  it("should import Use from XML", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withMultipleValues.xml")

    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, xml.UserVisible)

    expect(result).toEqual(withMultipleValuesUserVisible)
  })

  it("should import Use from XML with empty values", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withEmptyValues.xml")

    const expectedResult: UserVisible = {
      common: false,
      values: [],
    }

    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should handle single value in Use XML", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withSingleValue.xml")

    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, xml.UserVisible)

    expect(result).toEqual(withSingleValueUserVisible)
  })

  it("skips UserVisible values with unsupported boolean text", () => {
    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, {
      "xr:Value": { _name: "Role.Администратор", "#text": "maybe" as any },
    })

    expect(result).toEqual({ common: false, values: [] })
  })

  it("preserves Role-prefixed names and UUID names exactly", () => {
    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, {
      "xr:Common": "false",
      "xr:Value": [
        { _name: "Role.ПолныеПрава", "#text": "true" },
        { _name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", "#text": "true" },
      ],
    })

    expect(result).toEqual({
      common: false,
      values: [
        { name: "Role.ПолныеПрава", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true },
      ],
    })
  })
})
