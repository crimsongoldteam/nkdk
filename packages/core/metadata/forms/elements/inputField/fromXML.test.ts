import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import {
  fullInputField,
  fullTableInputField,
  minimalInputField,
  minimalTableInputField,
} from "~/tests/fixtures/forms/inputField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

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
      const xmlData = readAndParseXMLFile<{ InputField: ElementXML }>("forms/inputField/full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "InputField",
        xml: xmlData.InputField,
      })

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ InputField: ElementXML }>("forms/inputField/minimal.xml")

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
      const xmlData = readAndParseXMLFile<{ TableInputField: ElementXML }>("forms/inputField/fullTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableInputField",
        xml: xmlData.TableInputField,
      })

      expect(result).toEqual(fullTableInputField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ TableInputField: ElementXML }>("forms/inputField/minimalTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableInputField",
        xml: xmlData.TableInputField,
      })

      expect(result).toEqual(minimalTableInputField)
    })
  })
})
