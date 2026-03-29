import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import {
  fullCheckBoxField,
  fullTableCheckBoxField,
  minimalCheckBoxField,
  minimalTableCheckBoxField,
} from "~/metadata/forms/elements/checkBoxField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importCheckBoxFieldFromXML", () => {
  describe("importCheckBoxField", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "CheckBoxField",
        xml: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ CheckBoxField: ElementXML }>(import.meta.url, "full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "CheckBoxField",
        xml: xmlData.CheckBoxField,
      })

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ CheckBoxField: ElementXML }>(import.meta.url, "minimal.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "CheckBoxField",
        xml: xmlData.CheckBoxField,
      })

      expect(result).toEqual(minimalCheckBoxField)
    })
  })

  describe("import CheckBox (table) from XML", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableCheckBoxField",
        xml: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ TableCheckBoxField: ElementXML }>(import.meta.url, "fullTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableCheckBoxField",
        xml: xmlData.TableCheckBoxField,
      })

      expect(result).toEqual(fullTableCheckBoxField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ TableCheckBoxField: ElementXML }>(import.meta.url, "minimalTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableCheckBoxField",
        xml: xmlData.TableCheckBoxField,
      })

      expect(result).toEqual(minimalTableCheckBoxField)
    })
  })
})
