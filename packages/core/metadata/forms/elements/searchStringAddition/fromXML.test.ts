import { describe, expect, it } from "vitest"
import { importElementFromXML, importPropertyFromXML, PropertyRule } from "~/metadata/metadataFactory"
import {
    fullSearchStringAddition,
    fullSingleSearchStringAddition,
    minimalSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

const rule: PropertyRule = {
  type: "SearchStringAddition",
}

describe("SearchStringAddition from XML", () => {
  describe("Element", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ SearchStringAddition: any }>("forms/searchStringAddition/full.xml")

      const result = importElementFromXML({
        context: mockContext,
        itemType: "SearchStringAddition",
        xml: xmlData.SearchStringAddition,
      })

      expect(result).toEqual(fullSearchStringAddition)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ SearchStringAddition: any }>("forms/searchStringAddition/minimal.xml")

      const result = importElementFromXML({
        context: mockContext,
        itemType: "SearchStringAddition",
        xml: xmlData.SearchStringAddition,
      })

      expect(result).toEqual(minimalSearchStringAddition)
    })
  })

  describe("Single", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ SearchStringAddition: any }>("forms/searchStringAddition/fullSingle.xml")

      const result = importPropertyFromXML({
        context: mockContext,
        rule: rule,
        value: xmlData.SearchStringAddition,
      })

      expect(result).toEqual(fullSingleSearchStringAddition)
    })

    it("should return undefined for defaults", () => {
      const xmlData = readAndParseXMLFile<{ SearchStringAddition: any }>("forms/searchStringAddition/minimalSingle.xml")

      const result = importPropertyFromXML({
        context: mockContext,
        rule: rule,
        value: xmlData.SearchStringAddition,
      })

      expect(result).toBeUndefined()
    })
  })
})
