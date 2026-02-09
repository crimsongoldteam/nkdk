import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importPropertyFromEnterprise, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
  sourceSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { fullViewStatusAddition } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = { type: "SearchStringAddition" }

describe("SearchStringAddition from YAML", () => {
  describe("Partial", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: "SearchStringAddition",
        yaml: fullSearchStringAdditionEnterprise,
        source: fullSearchStringAddition,
      })

      expect(result).toEqual(fullSearchStringAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: "SearchStringAddition",
        yaml: {},
        source: minimalSearchStringAddition,
      })

      expect(result).toEqual(minimalSearchStringAddition)
    })

    it("should return undefined when yaml is undefined", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: "SearchStringAddition",
        yaml: undefined,
        source: fullSearchStringAddition,
      })

      expect(result).toBeUndefined()
    })
  })

  describe("Single", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPropertyFromEnterprise({
        context: mockContext,
        rule: rule,
        value: undefined,
        sourceValue: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = importPropertyFromEnterprise({
        context: mockContext,
        rule: rule,
        value: fullSearchStringAdditionEnterprise,
        sourceValue: sourceSearchStringAddition,
      })

      expect(result).toEqual(fullViewStatusAddition)
    })
  })
})
