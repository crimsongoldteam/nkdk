import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import {
  fullPictureField,
  fullTablePictureField,
  minimalPictureField,
  minimalTablePictureField,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

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
      const xmlData = readAndParseXMLFile<{ PictureField: ElementXML }>("forms/pictureField/full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "PictureField",
        xml: xmlData.PictureField,
      })

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ PictureField: ElementXML }>("forms/pictureField/minimal.xml")

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
      const xmlData = readAndParseXMLFile<{ TablePictureField: ElementXML }>("forms/pictureField/fullTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TablePictureField",
        xml: xmlData.TablePictureField,
      })

      expect(result).toEqual(fullTablePictureField)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ TablePictureField: ElementXML }>("forms/pictureField/minimalTable.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "TablePictureField",
        xml: xmlData.TablePictureField,
      })

      expect(result).toEqual(minimalTablePictureField)
    })
  })
})
