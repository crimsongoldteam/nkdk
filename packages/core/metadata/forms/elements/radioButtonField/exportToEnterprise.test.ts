import { describe, expect, it } from "vitest"
import {
  fullRadioButtonField,
  fullRadioButtonFieldPartialEnterprise,
  fullRadioButtonFieldTypedEnterprise,
  minimalRadioButtonField,
  minimalRadioButtonFieldPartialEnterprise,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportRadioButtonFieldPartialToEnterprise,
  exportRadioButtonFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportRadioButtonFieldToEnterprise", () => {
  describe("exportRadioButtonFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportRadioButtonFieldPartialToEnterprise(mockСontext, fullRadioButtonField)

      expect(result).toEqual(fullRadioButtonFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportRadioButtonFieldPartialToEnterprise(mockСontext, minimalRadioButtonField)

      expect(result).toEqual(minimalRadioButtonFieldPartialEnterprise)
    })
  })

  describe("exportRadioButtonFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportRadioButtonFieldTypedToEnterprise(mockСontext, fullRadioButtonField)

      expect(result).toEqual(fullRadioButtonFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportRadioButtonFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
