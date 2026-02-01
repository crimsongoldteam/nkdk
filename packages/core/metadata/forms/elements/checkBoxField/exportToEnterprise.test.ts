import { describe, expect, it } from "vitest"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialEnterprise,
  fullCheckBoxFieldTypedEnterprise,
  minimalCheckBoxField,
  minimalCheckBoxFieldPartialEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"
import { exportCheckBoxFieldPartialToEnterprise, exportCheckBoxFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportCheckBoxFieldToEnterprise", () => {
  describe("exportCheckBoxFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCheckBoxFieldPartialToEnterprise(mockContext, fullCheckBoxField)

      expect(result).toEqual(fullCheckBoxFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportCheckBoxFieldPartialToEnterprise(mockContext, minimalCheckBoxField)

      expect(result).toEqual(minimalCheckBoxFieldPartialEnterprise)
    })
  })

  describe("exportCheckBoxFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCheckBoxFieldTypedToEnterprise(mockContext, fullCheckBoxField)

      expect(result).toEqual(fullCheckBoxFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportCheckBoxFieldTypedToEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
