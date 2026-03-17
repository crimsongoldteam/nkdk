import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import {
  fullCheckBoxField,
  fullTableCheckBoxField,
  minimalCheckBoxField,
  minimalTableCheckBoxField,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

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
      const xmlData = readAndParseXMLFile<{ CheckBoxField: ElementXML }>("forms/checkBoxField/full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "CheckBoxField",
        xml: xmlData.CheckBoxField,
      })

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ CheckBoxField: ElementXML }>("forms/checkBoxField/minimal.xml")

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
      const xmlData = readAndParseXMLFile<{ TableCheckBoxField: ElementXML }>("forms/checkBoxField/fullTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableCheckBoxField",
        xml: xmlData.TableCheckBoxField,
      })

      expect(result).toEqual(fullTableCheckBoxField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ TableCheckBoxField: ElementXML }>("forms/checkBoxField/minimalTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TableCheckBoxField",
        xml: xmlData.TableCheckBoxField,
      })

      expect(result).toEqual(minimalTableCheckBoxField)
    })
  })
})
