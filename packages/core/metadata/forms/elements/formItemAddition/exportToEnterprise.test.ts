import { describe, expect, it } from "vitest"
import {
  fullFormItemAddition,
  fullFormItemAdditionPartialEnterprise,
  fullFormItemAdditionTypedEnterprise,
  minimalFormItemAddition,
  minimalFormItemAdditionPartialEnterprise,
  minimalFormItemAdditionTypedEnterprise,
} from "~/tests/fixtures/forms/formItemAddition/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportFormItemAdditionPartialToEnterprise,
  exportFormItemAdditionTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportFormItemAdditionToEnterprise", () => {
  describe("exportFormItemAdditionPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportFormItemAdditionPartialToEnterprise(mockСontext, fullFormItemAddition)

      expect(result).toEqual(fullFormItemAdditionPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportFormItemAdditionPartialToEnterprise(mockСontext, minimalFormItemAddition)

      expect(result).toEqual(minimalFormItemAdditionPartialEnterprise)
    })
  })

  describe("exportFormItemAdditionTypedToEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportFormItemAdditionTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportFormItemAdditionTypedToEnterprise(mockСontext, fullFormItemAddition)

      expect(result).toEqual(fullFormItemAdditionTypedEnterprise)
    })

    it("should export minimal", () => {
      const result = exportFormItemAdditionTypedToEnterprise(mockСontext, minimalFormItemAddition)

      expect(result).toEqual(minimalFormItemAdditionTypedEnterprise)
    })
  })
})

