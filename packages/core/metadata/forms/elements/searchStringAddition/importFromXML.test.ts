import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  minimalSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importSearchStringAdditionFromXML, importSingleSearchStringAdditionFromXML } from "./importFromXML"
import { SearchStringAdditionXML } from "./types"

describe("importSearchStringAdditionFromXML", () => {
  describe("importSingleSearchStringAdditionFromXML", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ SearchStringAddition: SearchStringAdditionXML }>(
        "forms/searchStringAddition/fullSingle.xml"
      )

      const result = importSingleSearchStringAdditionFromXML(mockСontext, xmlData.SearchStringAddition)

      expect(result).toEqual(fullSingleSearchStringAddition)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ SearchStringAddition: SearchStringAdditionXML }>(
        "forms/searchStringAddition/minimalSingle.xml"
      )

      const result = importSingleSearchStringAdditionFromXML(mockСontext, xmlData.SearchStringAddition)

      expect(result).toBeUndefined()
    })
  })
  describe("importSearchStringAdditionFromXML", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ SearchStringAddition: SearchStringAdditionXML }>(
        "forms/searchStringAddition/full.xml"
      )

      const result = importSearchStringAdditionFromXML(mockСontext, xmlData.SearchStringAddition)

      expect(result).toEqual(fullSearchStringAddition)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ SearchStringAddition: SearchStringAdditionXML }>(
        "forms/searchStringAddition/minimal.xml"
      )

      const result = importSearchStringAdditionFromXML(mockСontext, xmlData.SearchStringAddition)

      expect(result).toEqual(minimalSearchStringAddition)
    })
  })
})
