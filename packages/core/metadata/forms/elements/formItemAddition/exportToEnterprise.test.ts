import { describe, expect, it } from "vitest"
import {
  fullFormItemAddition,
  fullFormItemAdditionPartialEnterprise,
  minimalFormItemAddition,
  minimalFormItemAdditionPartialEnterprise,
} from "~/tests/fixtures/forms/formItemAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFormItemAdditionPartialToEnterprise } from "./exportToEnterprise"

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
})
