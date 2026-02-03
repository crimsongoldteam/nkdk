import { describe, expect, it } from "vitest"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialEnterprise,
  fullCheckBoxFieldTypedEnterprise,
  minimalCheckBoxField,
  minimalCheckBoxFieldPartialEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCheckBoxFieldPartialToEnterprise, exportCheckBoxFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportCheckBoxFieldToEnterprise", () => {
  describe("exportCheckBoxFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCheckBoxFieldPartialToEnterprise(mockContext, mockRule, fullCheckBoxField)

      expect(result).toEqual(fullCheckBoxFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportCheckBoxFieldPartialToEnterprise(mockContext, mockRule, minimalCheckBoxField)

      expect(result).toEqual(minimalCheckBoxFieldPartialEnterprise)
    })
  })

  describe("exportCheckBoxFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCheckBoxFieldTypedToEnterprise(mockContext, mockRule, fullCheckBoxField)

      expect(result).toEqual(fullCheckBoxFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportCheckBoxFieldTypedToEnterprise(mockContext, mockRule, undefined)

      expect(result).toBeUndefined()
    })
  })
})
