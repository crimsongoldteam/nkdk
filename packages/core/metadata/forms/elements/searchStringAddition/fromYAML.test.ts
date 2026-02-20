import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importPropertyFromYAML, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionYAML,
  fullSingleSearchStringAddition,
  minimalSearchStringAddition,
  sourceSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = { type: "SearchStringAddition" }

describe("SearchStringAddition from YAML", () => {
  describe("Partial", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "SearchStringAddition",
        yaml: fullSearchStringAdditionYAML,
        source: sourceSearchStringAddition,
      })

      expect(result).toEqual(fullSearchStringAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "SearchStringAddition",
        yaml: {},
        source: sourceSearchStringAddition,
      })

      expect(result).toEqual(minimalSearchStringAddition)
    })
  })

  describe("Single", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPropertyFromYAML({
        context: mockContext,
        rule: rule,
        value: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should export all fields to YAML", () => {
      const result = importPropertyFromYAML({
        context: mockContext,
        rule: rule,
        value: fullSearchStringAdditionYAML,
      })

      expect(result).toEqual(fullSingleSearchStringAddition)
    })
  })
})
