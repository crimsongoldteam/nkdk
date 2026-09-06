import { describe, expect, it } from "vitest"
import { fullFieldsList } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
import { importFieldsListFromXML } from "./fromXML"
import { FieldsListXML } from "./types"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

describe("importFieldsListFromXML", () => {
  it.each([
    ["<Fields/>", undefined],
    ["<Fields><Field/></Fields>", undefined],
    ["<Fields><Field>А</Field><Field>Б</Field></Fields>", ["А", "Б"]],
    ["<Fields><Field/><Field>Б</Field></Fields>", [undefined, "Б"]],
  ])("reads structural field list: %s", (xml, expected) => {
    expect(importFieldsListFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("should return undefined when xml is undefined", () => {
    const result = importFieldsListFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xml = readAndParseXMLFile<{ UseAlways: FieldsListXML }>("fieldsList/full.xml")

    const result = importFieldsListFromXML(mockContextFromXML(), mockRule, xml.UseAlways)

    expect(result).toEqual(fullFieldsList)
  })
})
