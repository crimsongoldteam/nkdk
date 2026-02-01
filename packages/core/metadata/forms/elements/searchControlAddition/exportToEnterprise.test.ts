import { describe, expect, it } from "vitest"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionEnterprise,
  fullSingleSearchControlAddition,
  fullSingleSearchControlAdditionEnterprise,
  minimalSearchControlAddition,
  minimalSingleSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext } from "~/tests/mockContext"
import {
  exportSearchControlAdditionPartialToEnterprise,
  exportSingleSearchControlAdditionToEnterprise,
} from "./exportToEnterprise"

describe("exportToEnterprise", () => {
  describe("exportSingleSearchControlAdditionToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportSingleSearchControlAdditionToEnterprise(mockContext, fullSingleSearchControlAddition)

      expect(result).toEqual(fullSingleSearchControlAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSingleSearchControlAdditionToEnterprise(mockContext, minimalSingleSearchControlAddition)

      expect(result).toBeUndefined()
    })
  })

  describe("exportSearchControlAdditionPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportSearchControlAdditionPartialToEnterprise(mockContext, fullSearchControlAddition)

      expect(result).toEqual(fullSearchControlAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSearchControlAdditionPartialToEnterprise(mockContext, minimalSearchControlAddition)

      expect(result).toBeUndefined()
    })
  })
})
