import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import {
  fullLabelField,
  fullTableLabelField,
  minimalLabelField,
  minimalTableLabelField,
} from "~/tests/fixtures/forms/labelField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importLabelFieldFromXML", () => {
  describe("LabelField", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "LabelField",
        xml: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ LabelField: ElementXML }>("forms/labelField/full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "LabelField",
        xml: xmlData.LabelField,
      })

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ LabelField: ElementXML }>("forms/labelField/minimal.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "LabelField",
        xml: xmlData.LabelField,
      })

      expect(result).toEqual(minimalLabelField)
    })
  })

  describe("TableLabelField", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableLabelField",
        xml: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ TableLabelField: ElementXML }>("forms/labelField/fullTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableLabelField",
        xml: xmlData.TableLabelField,
      })

      expect(result).toEqual(fullTableLabelField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ TableLabelField: ElementXML }>("forms/labelField/minimalTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableLabelField",
        xml: xmlData.TableLabelField,
      })

      expect(result).toEqual(minimalTableLabelField)
    })
  })
})
