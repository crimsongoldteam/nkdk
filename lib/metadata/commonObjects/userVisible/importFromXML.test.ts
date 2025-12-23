import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importUserVisibleFromXML } from "./importFromXML"
import { UserVisible, UserVisibleXML } from "./types"

describe("importUserVisibleFromXML", () => {
  it("should import Use from XML", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withMultipleValues.xml")

    const expectedResult: UserVisible = {
      common: true,
      values: [
        {
          name: "Администратор",
          value: true,
        },
        {
          name: "Пользователь",
          value: false,
        },
      ],
    }

    const result = importUserVisibleFromXML(mockConfigurationSettings, xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })

  it("should import Use from XML with empty values", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withEmptyValues.xml")

    const expectedResult: UserVisible = {
      common: false,
      values: [],
    }

    const result = importUserVisibleFromXML(mockConfigurationSettings, xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = importUserVisibleFromXML(mockConfigurationSettings, undefined)

    expect(result).toBeUndefined()
  })

  it("should handle single value in Use XML", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withSingleValue.xml")

    const expectedResult: UserVisible = {
      common: true,
      values: [
        {
          name: "Менеджер",
          value: true,
        },
      ],
    }

    const result = importUserVisibleFromXML(mockConfigurationSettings, xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })
})
