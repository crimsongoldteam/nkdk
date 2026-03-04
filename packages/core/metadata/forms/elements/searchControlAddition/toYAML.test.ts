import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportPropertyToYAML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionYAML,
  fullSingleSearchControlAddition,
  fullSingleSearchControlAdditionYAML,
  minimalSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "SearchStringAddition",
  yaml: "УправлениеПоиском",
}

describe("SearchControlAddition to YAML", () => {
  describe("Single", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportPropertyToYAML({
        context: mockContext,
        rule: rule,
        value: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should full", () => {
      const result = exportPropertyToYAML({
        context: mockContext,
        rule: rule,
        value: fullSingleSearchControlAddition,
      })

      expect(result).toHaveProperty("УправлениеПоиском", fullSingleSearchControlAdditionYAML)
    })
  })

  describe("Partial to YAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({
        context: mockContext,
        element: fullSearchControlAddition,
      })

      expect(result).toEqual(fullSearchControlAdditionYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalSearchControlAddition })

      expect(result).toBeUndefined()
    })
  })
})
