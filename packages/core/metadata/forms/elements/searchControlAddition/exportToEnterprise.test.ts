import { describe, expect, it } from "vitest"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionEnterprise,
  fullSingleSearchControlAddition,
  fullSingleSearchControlAdditionEnterprise,
  minimalSearchControlAddition,
  minimalSingleSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  exportSearchControlAdditionPartialToEnterprise,
  exportSingleSearchControlAdditionToEnterprise,
} from "./exportToEnterprise"

describe("exportToEnterprise", () => {
  describe("exportSingleSearchControlAdditionToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportSingleSearchControlAdditionToEnterprise(
        mockContext,
        mockRule,
        fullSingleSearchControlAddition
      )

      expect(result).toEqual(fullSingleSearchControlAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSingleSearchControlAdditionToEnterprise(
        mockContext,
        mockRule,
        minimalSingleSearchControlAddition
      )

      expect(result).toBeUndefined()
    })
  })

  describe("exportSearchControlAdditionPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportSearchControlAdditionPartialToEnterprise(mockContext, mockRule, fullSearchControlAddition)

      expect(result).toEqual(fullSearchControlAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSearchControlAdditionPartialToEnterprise(mockContext, mockRule, minimalSearchControlAddition)

      expect(result).toBeUndefined()
    })
  })
})
