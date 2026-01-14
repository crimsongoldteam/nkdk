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
import { importInputFieldPartialFromEnterprise, importInputFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importInputFieldFromEnterprise", () => {
  describe("importInputFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importInputFieldTypedFromEnterprise(mockСontext, undefined, "ПолеВвода")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importInputFieldTypedFromEnterprise(mockСontext, fullInputFieldTypedEnterprise, "ПолеВвода")

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importInputFieldTypedFromEnterprise(mockСontext, minimalInputFieldTypedEnterprise, "ПолеВвода")

      expect(result).toEqual(minimalInputField)
    })
  })

  describe("importInputFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importInputFieldPartialFromEnterprise(mockСontext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importInputFieldPartialFromEnterprise(mockСontext, fullInputField, fullInputFieldPartialEnterprise)

      expect(result).toEqual(fullInputField)
    })

    it("should import minimal", () => {
      const result = importInputFieldPartialFromEnterprise(
        mockСontext,
        minimalInputField,
        minimalInputFieldPartialEnterprise
      )

      expect(result).toEqual(minimalInputField)
    })
  })
})
