import { describe, expect, it } from "vitest"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionEnterprise,
  fullSingleSearchStringAddition,
  fullSingleSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
  sourceSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importSearchStringAdditionPartialFromEnterprise,
  importSingleSearchStringAdditionFromEnterprise,
} from "./importFromEnterprise"

describe("importFromEnterprise", () => {
  describe("importSingleSearchStringAdditionFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importSingleSearchStringAdditionFromEnterprise(
        mockContext,
        mockRule,
        fullSingleSearchStringAdditionEnterprise
      )

      expect(result).toEqual(fullSingleSearchStringAddition)
    })

    it("should import minimal", () => {
      const result = importSingleSearchStringAdditionFromEnterprise(mockContext, mockRule, {})

      expect(result).toBeUndefined()
    })
  })

  describe("importSearchStringAdditionPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importSearchStringAdditionPartialFromEnterprise(
        mockContext,
        mockRule,
        sourceSearchStringAddition,
        fullSearchStringAdditionEnterprise
      )

      expect(result).toEqual(fullSearchStringAddition)
    })

    it("should import minimal", () => {
      const result = importSearchStringAdditionPartialFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        sourceSearchStringAddition,
        {}
      )

      expect(result).toEqual(minimalSearchStringAddition)
    })
  })
})
