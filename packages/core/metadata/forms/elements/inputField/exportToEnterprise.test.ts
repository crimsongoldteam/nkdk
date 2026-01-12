import { describe, expect, it } from "vitest"
import {
  fullInputField,
  fullInputFieldPartialEnterprise,
  fullInputFieldTypedEnterprise,
  minimalInputField,
  minimalInputFieldPartialEnterprise,
  minimalInputFieldTypedEnterprise,
} from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportInputFieldPartialToEnterprise,
  exportInputFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportInputFieldToEnterprise", () => {
  describe("exportInputFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportInputFieldPartialToEnterprise(mockСontext, fullInputField)

      expect(result).toEqual(fullInputFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportInputFieldPartialToEnterprise(mockСontext, minimalInputField)

      expect(result).toEqual(minimalInputFieldPartialEnterprise)
    })
  })

  describe("exportInputFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportInputFieldTypedToEnterprise(mockСontext, fullInputField)

      expect(result).toEqual(fullInputFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportInputFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
