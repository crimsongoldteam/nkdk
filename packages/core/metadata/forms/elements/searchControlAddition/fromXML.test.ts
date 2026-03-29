import { describe, expect, it } from "vitest"
import { importElementFromXML, importPropertyFromXML, PropertyRule } from "~/metadata/orchestration"
import {
  fullSearchControlAddition,
  fullSingleSearchControlAddition,
  minimalSearchControlAddition,
} from "~/metadata/forms/elements/searchControlAddition/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "SingleSearchControlAddition",
}

describe("SearchControlAddition from XML", () => {
  describe("Element", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ SearchControlAddition: any }>(import.meta.url, "full.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "SearchControlAddition",
        xml: xmlData.SearchControlAddition,
      })

      expect(result).toEqual(fullSearchControlAddition)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFixture<{ SearchControlAddition: any }>(import.meta.url, "minimal.xml")

      const result = importElementFromXML({
        context: mockContextFromXML(),
        itemType: "SearchControlAddition",
        xml: xmlData.SearchControlAddition,
      })

      expect(result).toEqual(minimalSearchControlAddition)
    })
  })

  describe("Single", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFixture<{ SearchControlAddition: any }>(import.meta.url, "fullSingle.xml")

      const result = importPropertyFromXML({
        context: mockContextFromXML(),
        rule: rule,
        value: xmlData.SearchControlAddition,
      })

      expect(result).toEqual(fullSingleSearchControlAddition)
    })

    it("should return undefined for defaults", () => {
      const xmlData = readAndParseXMLFile<{ SearchControlAddition: any }>(
        "forms/searchControlAddition/minimalSingle.xml"
      )

      const result = importPropertyFromXML({
        context: mockContextFromXML(),
        rule: rule,
        value: xmlData.SearchControlAddition,
      })

      expect(result).toBeUndefined()
    })
  })
})
