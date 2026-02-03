import { describe, expect, it } from "vitest"
import {
  fullPictureField,
  fullPictureFieldPartialEnterprise,
  fullPictureFieldTypedEnterprise,
  minimalPictureField,
  minimalPictureFieldPartialEnterprise,
  minimalPictureFieldTypedEnterprise,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importPictureFieldPartialFromEnterprise, importPictureFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importPictureFieldFromEnterprise", () => {
  describe("importPictureFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPictureFieldTypedFromEnterprise(mockContext, mockRule, undefined, "ПолеКартинки")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPictureFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        mockRule,
        fullPictureFieldTypedEnterprise,
        "ПолеКартинки"
      )

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importPictureFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalPictureFieldTypedEnterprise,
        "ПолеКартинки"
      )

      expect(result).toEqual(minimalPictureField)
    })
  })

  describe("importPictureFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importPictureFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importPictureFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullPictureField,
        fullPictureFieldPartialEnterprise
      )

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importPictureFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalPictureField,
        minimalPictureFieldPartialEnterprise
      )

      expect(result).toEqual(minimalPictureField)
    })
  })
})
