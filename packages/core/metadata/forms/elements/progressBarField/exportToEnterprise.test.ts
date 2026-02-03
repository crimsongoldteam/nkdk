import { describe, expect, it } from "vitest"
import {
  fullProgressBarField,
  fullProgressBarFieldPartialEnterprise,
  fullProgressBarFieldTypedEnterprise,
  minimalProgressBarField,
  minimalProgressBarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  exportProgressBarFieldPartialToEnterprise,
  exportProgressBarFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportProgressBarFieldToEnterprise", () => {
  describe("exportProgressBarFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportProgressBarFieldPartialToEnterprise(mockContext, mockRule, fullProgressBarField)

      expect(result).toEqual(fullProgressBarFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportProgressBarFieldPartialToEnterprise(mockContext, mockRule, minimalProgressBarField)

      expect(result).toEqual(minimalProgressBarFieldPartialEnterprise)
    })
  })

  describe("exportProgressBarFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportProgressBarFieldTypedToEnterprise(mockContext, mockRule, fullProgressBarField)

      expect(result).toEqual(fullProgressBarFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportProgressBarFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
