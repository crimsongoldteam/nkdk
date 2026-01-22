import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import {
  fullSearchControlAddition,
  fullSingleSearchControlAddition,
  minimalSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importSearchControlAdditionFromXML, importSingleSearchControlAdditionFromXML } from "./importFromXML"
import { SearchControlAdditionXML } from "./types"

describe("importSearchControlAdditionFromXML", () => {
  describe("importSingleSearchControlAdditionFromXML", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ SearchControlAddition: SearchControlAdditionXML }>(
        "forms/searchControlAddition/fullSingle.xml"
      )

      const result = importSingleSearchControlAdditionFromXML(mockСontext, xmlData.SearchControlAddition)

      expect(result).toEqual(fullSingleSearchControlAddition)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ SearchControlAddition: SearchControlAdditionXML }>(
        "forms/searchControlAddition/minimalSingle.xml"
      )

      const result = importSingleSearchControlAdditionFromXML(mockСontext, xmlData.SearchControlAddition)

      expect(result).toBeUndefined()
    })
  })
  describe("importSearchControlAdditionFromXML", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ SearchControlAddition: SearchControlAdditionXML }>(
        "forms/searchControlAddition/full.xml"
      )

      const result = importSearchControlAdditionFromXML(mockСontext, xmlData.SearchControlAddition)

      expect(result).toEqual(fullSearchControlAddition)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ SearchControlAddition: SearchControlAdditionXML }>(
        "forms/searchControlAddition/minimal.xml"
      )

      const result = importSearchControlAdditionFromXML(mockСontext, xmlData.SearchControlAddition)

      expect(result).toEqual(minimalSearchControlAddition)
    })
  })
})
