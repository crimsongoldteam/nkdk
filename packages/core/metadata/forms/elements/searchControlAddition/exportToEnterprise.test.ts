import { describe, expect, it } from "vitest"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionEnterprise,
  fullSingleSearchControlAddition,
  fullSingleSearchControlAdditionEnterprise,
  minimalSearchControlAddition,
  minimalSingleSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportSearchControlAdditionPartialToEnterprise,
  exportSingleSearchControlAdditionToEnterprise,
} from "./exportToEnterprise"

describe("exportToEnterprise", () => {
  describe("exportSingleSearchControlAdditionToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportSingleSearchControlAdditionToEnterprise(mockСontext, fullSingleSearchControlAddition)

      expect(result).toEqual(fullSingleSearchControlAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSingleSearchControlAdditionToEnterprise(mockСontext, minimalSingleSearchControlAddition)

      expect(result).toBeUndefined()
    })
  })

  describe("exportSearchControlAdditionPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportSearchControlAdditionPartialToEnterprise(mockСontext, fullSearchControlAddition)

      expect(result).toEqual(fullSearchControlAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSearchControlAdditionPartialToEnterprise(mockСontext, minimalSearchControlAddition)

      expect(result).toBeUndefined()
    })
  })
})

