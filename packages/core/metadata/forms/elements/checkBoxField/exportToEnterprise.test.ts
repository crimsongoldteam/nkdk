import { describe, expect, it } from "vitest"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialEnterprise,
  fullCheckBoxFieldTypedEnterprise,
  minimalCheckBoxField,
  minimalCheckBoxFieldPartialEnterprise,
  minimalCheckBoxFieldTypedEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportCheckBoxFieldPartialToEnterprise,
  exportCheckBoxFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportCheckBoxFieldToEnterprise", () => {
  describe("exportCheckBoxFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCheckBoxFieldPartialToEnterprise(mockСontext, fullCheckBoxField)

      expect(result).toEqual(fullCheckBoxFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportCheckBoxFieldPartialToEnterprise(mockСontext, minimalCheckBoxField)

      expect(result).toEqual(minimalCheckBoxFieldPartialEnterprise)
    })
  })

  describe("exportCheckBoxFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportCheckBoxFieldTypedToEnterprise(mockСontext, fullCheckBoxField)

      expect(result).toEqual(fullCheckBoxFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportCheckBoxFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
