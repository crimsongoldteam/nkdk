import { describe, expect, it } from "vitest"
import { importElementFromXML, importPropertyFromXML, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullSearchControlAddition,
  fullSingleSearchControlAddition,
  minimalSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

const rule: PropertyRule<any> = {
  type: "SearchControlAddition",
}

describe("SearchControlAddition from XML", () => {
  describe("Element", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ SearchControlAddition: any }>("forms/searchControlAddition/full.xml")

      const result = importElementFromXML({
        context: mockContext,
        itemType: "SearchControlAddition",
        xml: xmlData.SearchControlAddition,
      })

      expect(result).toEqual(fullSearchControlAddition)
    })

    it("should import minimal", () => {
      const xmlData = readAndParseXMLFile<{ SearchControlAddition: any }>("forms/searchControlAddition/minimal.xml")

      const result = importElementFromXML({
        context: mockContext,
        itemType: "SearchControlAddition",
        xml: xmlData.SearchControlAddition,
      })

      expect(result).toEqual(minimalSearchControlAddition)
    })
  })

  describe("Single", () => {
    it("should import all fields from XML", () => {
      const xmlData = readAndParseXMLFile<{ SearchControlAddition: any }>("forms/searchControlAddition/fullSingle.xml")

      const result = importPropertyFromXML({
        context: mockContext,
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
        context: mockContext,
        rule: rule,
        value: xmlData.SearchControlAddition,
      })

      expect(result).toBeUndefined()
    })
  })
})
