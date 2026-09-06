import { describe,expect,it } from "vitest"
import { mockContextFromXML,mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
import { withMultipleValuesUserVisible } from "./__fixtures__/withMultipleValues"
import { withSingleValueUserVisible } from "./__fixtures__/withSingleValue"
import { importUserVisibleFromXML } from "./fromXML"
import { UserVisible,UserVisibleXML } from "./types"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { importContentFromXML } from "@nkdk/runtime"

describe("importUserVisibleFromXML", () => {
  it("does not invent a role from a value without attributes", () => {
    const xml = "<UserVisible><xr:Value>true</xr:Value></UserVisible>"
    const expected = { common: false, values: [] }
    expect(importUserVisibleFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ UserVisible: UserVisibleXML }>(xml).UserVisible)).toEqual(expected)
    expect(importUserVisibleFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("rejects empty entries among repeated visibility values", () => {
    const xml = '<UserVisible><xr:Value/><xr:Value name="Role.А">true</xr:Value></UserVisible>'
    expect(() => importUserVisibleFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ UserVisible: UserVisibleXML }>(xml).UserVisible)).toThrow()
    expect(() => importUserVisibleFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toThrow()
  })

  it.each([
    ["withMultipleValues.xml", withMultipleValuesUserVisible],
    ["withSingleValue.xml", withSingleValueUserVisible],
    ["withEmptyValues.xml", { common: false, values: [] }],
  ])("reads structural visibility: %s", (file, expected) => {
    expect(importUserVisibleFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, file)))).toEqual(expected)
  })

  it("preserves literal names, including empty names, in structural visibility", () => {
    const xml = '<UserVisible><xr:Value name="">false</xr:Value><xr:Value name="b1d9c8b4-d05c-45c7-8db2-abc84e597700">true</xr:Value></UserVisible>'
    expect(importUserVisibleFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual({ common: false, values: [{ name: "", value: false }, { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true }] })
  })

  it("keeps an empty structural visibility absent", () => {
    expect(importUserVisibleFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility("<UserVisible/>"))).toBeUndefined()
  })

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
