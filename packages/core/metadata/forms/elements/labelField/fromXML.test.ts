import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import {
  fullLabelField,
  fullTableLabelField,
  minimalLabelField,
  minimalTableLabelField,
} from "~/metadata/forms/elements/labelField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

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
      const xmlData = readAndParseXMLFixture<{ LabelField: ElementXML }>(import.meta.url, "full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "LabelField",
        xml: xmlData.LabelField,
      })

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ LabelField: ElementXML }>(import.meta.url, "minimal.xml")

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
      const xmlData = readAndParseXMLFixture<{ TableLabelField: ElementXML }>(import.meta.url, "fullTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableLabelField",
        xml: xmlData.TableLabelField,
      })

      expect(result).toEqual(fullTableLabelField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ TableLabelField: ElementXML }>(import.meta.url, "minimalTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableLabelField",
        xml: xmlData.TableLabelField,
      })

      expect(result).toEqual(minimalTableLabelField)
    })
  })
})
