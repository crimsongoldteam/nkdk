import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionYAML,
  fullSingleSearchControlAddition,
  minimalSearchControlAddition,
  sourceSearchControlAddition,
} from "~/metadata/forms/elements/searchControlAddition/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = { type: "SingleSearchControlAddition" }

describe("SearchControlAddition from YAML", () => {
  describe("Partial", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "SearchControlAddition",
        yaml: fullSearchControlAdditionYAML,
        source: sourceSearchControlAddition,
      })

      expect(result).toEqual(fullSearchControlAddition)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "SearchControlAddition",
        yaml: {},
        source: sourceSearchControlAddition,
      })

      expect(result).toEqual(minimalSearchControlAddition)
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
        value: fullSearchControlAdditionYAML,
      })

      expect(result).toEqual(fullSingleSearchControlAddition)
    })
  })
})
