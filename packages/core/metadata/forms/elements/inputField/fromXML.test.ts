import { describe, expect, it } from "vitest"
import {
  fullInputField,
  fullTableInputField,
  minimalInputField,
  minimalTableInputField,
} from "~/metadata/forms/elements/inputField/__fixtures__/data"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importInputFieldFromXML", () => {
  describe("InputField", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "InputField",
        xml: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ InputField: ElementXML }>(import.meta.url, "full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "InputField",
        xml: xmlData.InputField,
      })

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ InputField: ElementXML }>(import.meta.url, "minimal.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "InputField",
        xml: xmlData.InputField,
      })

      expect(result).toEqual(minimalInputField)
    })
  })

  describe("TableInputField", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableInputField",
        xml: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ TableInputField: ElementXML }>(import.meta.url, "fullTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableInputField",
        xml: xmlData.TableInputField,
      })

      expect(result).toEqual(fullTableInputField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ TableInputField: ElementXML }>(import.meta.url, "minimalTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableInputField",
        xml: xmlData.TableInputField,
      })

      expect(result).toEqual(minimalTableInputField)
    })
  })
})
