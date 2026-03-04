import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportPropertyToYAML } from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionYAML,
  fullSingleSearchStringAddition,
  fullSingleSearchStringAdditionYAML,
  minimalSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "SearchStringAddition",
  yaml: "ОтображениеСтрокиПоиска",
}
describe("SearchStringAddition to YAML", () => {
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
        value: fullSingleSearchStringAddition,
      })

      expect(result).toHaveProperty("ОтображениеСтрокиПоиска", fullSingleSearchStringAdditionYAML)
    })
  })

  describe("Partial to YAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({
        context: mockContext,
        element: fullSearchStringAddition,
      })

      expect(result).toEqual(fullSearchStringAdditionYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalSearchStringAddition })

      expect(result).toBeUndefined()
    })
  })
})
