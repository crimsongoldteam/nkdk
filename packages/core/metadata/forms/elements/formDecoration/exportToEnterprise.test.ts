import { describe, expect, it } from "vitest"
import {
  fullFormDecoration,
  fullFormDecorationPartialEnterprise,
  fullFormDecorationTypedEnterprise,
  minimalFormDecoration,
  minimalFormDecorationPartialEnterprise,
} from "~/tests/fixtures/forms/formDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFormDecorationPartialToEnterprise, exportFormDecorationTypedToEnterprise } from "./exportToEnterprise"

describe("exportFormDecorationToEnterprise", () => {
  describe("exportFormDecorationPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportFormDecorationPartialToEnterprise(mockСontext, fullFormDecoration)

      expect(result).toEqual(fullFormDecorationPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportFormDecorationPartialToEnterprise(mockСontext, minimalFormDecoration)

      expect(result).toEqual(minimalFormDecorationPartialEnterprise)
    })
  })

  describe("exportFormDecorationTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportFormDecorationTypedToEnterprise(mockСontext, fullFormDecoration)

      expect(result).toEqual(fullFormDecorationTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportFormDecorationTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
