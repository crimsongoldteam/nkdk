import { describe, expect, it } from "vitest"
import {
  fullButton,
  fullButtonPartialEnterprise,
  fullButtonTypedEnterprise,
  minimalButton,
  minimalButtonPartialEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportButtonPartialToEnterprise, exportButtonTypedToEnterprise } from "./exportToEnterprise"

describe("exportButtonToEnterprise", () => {
  describe("exportButtonPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportButtonPartialToEnterprise(mockContext, mockRule, fullButton)

      expect(result).toEqual(fullButtonPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportButtonPartialToEnterprise(mockContext, mockRule, minimalButton)

      expect(result).toEqual(minimalButtonPartialEnterprise)
    })
  })

  describe("exportButtonTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportButtonTypedToEnterprise(mockContext, mockRule, fullButton)

      expect(result).toEqual(fullButtonTypedEnterprise)
    })
  })
})
