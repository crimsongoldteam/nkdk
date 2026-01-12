import { describe, expect, it } from "vitest"
import {
  fullButton,
  fullButtonPartialEnterprise,
  fullButtonTypedEnterprise,
  minimalButton,
  minimalButtonPartialEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { exportButtonPartialToEnterprise, exportButtonTypedToEnterprise } from "./exportToEnterprise"

describe("exportButtonToEnterprise", () => {
  describe("exportButtonPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportButtonPartialToEnterprise(mockСontext, fullButton)

      expect(result).toEqual(fullButtonPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportButtonPartialToEnterprise(mockСontext, minimalButton)

      expect(result).toEqual(minimalButtonPartialEnterprise)
    })
  })

  describe("exportButtonTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportButtonTypedToEnterprise(mockСontext, fullButton)

      expect(result).toEqual(fullButtonTypedEnterprise)
    })
  })
})
