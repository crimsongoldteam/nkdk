import { describe, expect, it } from "vitest"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionEnterprise,
  fullSingleSearchStringAddition,
  fullSingleSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
  sourceSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"
import {
  importSearchStringAdditionPartialFromEnterprise,
  importSingleSearchStringAdditionFromEnterprise,
} from "./importFromEnterprise"

describe("importFromEnterprise", () => {
  describe("importSingleSearchStringAdditionFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importSingleSearchStringAdditionFromEnterprise(
        mockContext,
        fullSingleSearchStringAdditionEnterprise
      )

      expect(result).toEqual(fullSingleSearchStringAddition)
    })

    it("should import minimal", () => {
      const result = importSingleSearchStringAdditionFromEnterprise(mockContext, {})

      expect(result).toBeUndefined()
    })
  })

  describe("importSearchStringAdditionPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importSearchStringAdditionPartialFromEnterprise(
        mockContext,
        sourceSearchStringAddition,
        fullSearchStringAdditionEnterprise
      )

      expect(result).toEqual(fullSearchStringAddition)
    })

    it("should import minimal", () => {
      const result = importSearchStringAdditionPartialFromEnterprise(mockContext, sourceSearchStringAddition, {})

      expect(result).toEqual(minimalSearchStringAddition)
    })
  })
})
