import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importPropertyFromEnterprise, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionEnterprise,
  fullSingleSearchControlAddition,
  minimalSearchControlAddition,
  sourceSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = { type: "SearchControlAddition" }

describe("SearchControlAddition from YAML", () => {
  describe("Partial", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: "SearchControlAddition",
        yaml: fullSearchControlAdditionEnterprise,
        source: sourceSearchControlAddition,
      })

      expect(result).toEqual(fullSearchControlAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: "SearchControlAddition",
        yaml: {},
        source: sourceSearchControlAddition,
      })

      expect(result).toEqual(minimalSearchControlAddition)
    })
  })

  describe("Single", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPropertyFromEnterprise({
        context: mockContext,
        rule: rule,
        value: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = importPropertyFromEnterprise({
        context: mockContext,
        rule: rule,
        value: fullSearchControlAdditionEnterprise,
      })

      expect(result).toEqual(fullSingleSearchControlAddition)
    })
  })
})
