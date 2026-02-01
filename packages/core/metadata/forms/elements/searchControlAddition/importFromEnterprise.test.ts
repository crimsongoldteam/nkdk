import { describe, expect, it } from "vitest"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionEnterprise,
  fullSingleSearchControlAddition,
  fullSingleSearchControlAdditionEnterprise,
  minimalSearchControlAddition,
  sourceSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext } from "~/tests/mockContext"
import {
  importSearchControlAdditionPartialFromEnterprise,
  importSingleSearchControlAdditionFromEnterprise,
} from "./importFromEnterprise"

describe("importFromEnterprise", () => {
  describe("importSingleSearchControlAdditionFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importSingleSearchControlAdditionFromEnterprise(
        mockContext,
        fullSingleSearchControlAdditionEnterprise
      )

      expect(result).toEqual(fullSingleSearchControlAddition)
    })

    it("should import minimal", () => {
      const result = importSingleSearchControlAdditionFromEnterprise(mockContext, {})

      expect(result).toBeUndefined()
    })
  })

  describe("importSearchControlAdditionPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importSearchControlAdditionPartialFromEnterprise(
        mockContext,
        sourceSearchControlAddition,
        fullSearchControlAdditionEnterprise
      )

      expect(result).toEqual(fullSearchControlAddition)
    })

    it("should import minimal", () => {
      const result = importSearchControlAdditionPartialFromEnterprise(mockContext, sourceSearchControlAddition, {})

      expect(result).toEqual(minimalSearchControlAddition)
    })
  })
})
