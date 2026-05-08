import { describe, expect, it } from "vitest"
import { withMultipleValuesUserVisible } from "~/tests/fixtures/userVisible/withMultipleValues"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
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
    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, {
      "xr:Common": "true",
      "xr:Value": { _name: "Role.Администратор", "#text": "false" },
    })

    expect(result).toEqual({
      common: true,
      values: [{ name: "Администратор", value: false }],
    })
  })

  it("skips UserVisible values with unsupported boolean text", () => {
    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, {
      "xr:Value": { _name: "Role.Администратор", "#text": "maybe" as any },
    })

    expect(result).toEqual({ common: false, values: [] })
  })
})
