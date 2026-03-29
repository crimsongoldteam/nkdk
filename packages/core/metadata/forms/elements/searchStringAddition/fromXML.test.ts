import { describe, expect, it } from "vitest"
import { importElementFromXML, importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  minimalSearchStringAddition,
} from "~/metadata/forms/elements/searchStringAddition/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "SingleSearchStringAddition",
}

describe("SearchStringAddition from XML", () => {
  describe("Element", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ SearchStringAddition: any }>(import.meta.url, "full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "SearchStringAddition",
        xml: xmlData.SearchStringAddition,
      })

      expect(result).toEqual(fullSearchStringAddition)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ SearchStringAddition: any }>(import.meta.url, "minimal.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "SearchStringAddition",
        xml: xmlData.SearchStringAddition,
      })

      expect(result).toEqual(minimalSearchStringAddition)
    })
  })

  describe("Single", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ SearchStringAddition: any }>(import.meta.url, "fullSingle.xml")

      const result = importPropertyFromXML({
        context: mockContextFromXML(),
        rule: rule,
        value: xmlData.SearchStringAddition,
      })

      expect(result).toEqual(fullSingleSearchStringAddition)
    })

    it("should return undefined for defaults", () => {
      const xmlData = readAndParseXMLFixture<{ SearchStringAddition: any }>(import.meta.url, "minimalSingle.xml")

      const result = importPropertyFromXML({
        context: mockContextFromXML(),
        rule: rule,
        value: xmlData.SearchStringAddition,
      })

      expect(result).toBeUndefined()
    })
  })
})
