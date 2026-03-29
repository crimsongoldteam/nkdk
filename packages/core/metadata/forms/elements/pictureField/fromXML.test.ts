import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import {
  fullPictureField,
  fullTablePictureField,
  minimalPictureField,
  minimalTablePictureField,
} from "~/metadata/forms/elements/pictureField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importPictureFieldFromXML", () => {
  describe("PictureField", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "PictureField",
        xml: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ PictureField: ElementXML }>(import.meta.url, "full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "PictureField",
        xml: xmlData.PictureField,
      })

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ PictureField: ElementXML }>(import.meta.url, "minimal.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "PictureField",
        xml: xmlData.PictureField,
      })

      expect(result).toEqual(minimalPictureField)
    })
  })

  describe("TablePictureField", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TablePictureField",
        xml: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ TablePictureField: ElementXML }>(import.meta.url, "fullTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TablePictureField",
        xml: xmlData.TablePictureField,
      })

      expect(result).toEqual(fullTablePictureField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ TablePictureField: ElementXML }>(import.meta.url, "minimalTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TablePictureField",
        xml: xmlData.TablePictureField,
      })

      expect(result).toEqual(minimalTablePictureField)
    })
  })
})
