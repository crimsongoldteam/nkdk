import { describe, expect, it } from "vitest"
import {
  fullPictureField,
  fullPictureFieldPartialEnterprise,
  fullPictureFieldTypedEnterprise,
  minimalPictureField,
  minimalPictureFieldPartialEnterprise,
  minimalPictureFieldTypedEnterprise,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockContext } from "~/tests/mockContext"
import { importPictureFieldPartialFromEnterprise, importPictureFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importPictureFieldFromEnterprise", () => {
  describe("importPictureFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPictureFieldTypedFromEnterprise(mockContext, undefined, "ПолеКартинки")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPictureFieldTypedFromEnterprise(mockContext, fullPictureFieldTypedEnterprise, "ПолеКартинки")

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importPictureFieldTypedFromEnterprise(
        mockContext,
        minimalPictureFieldTypedEnterprise,
        "ПолеКартинки"
      )

      expect(result).toEqual(minimalPictureField)
    })
  })

  describe("importPictureFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importPictureFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importPictureFieldPartialFromEnterprise(
        mockContext,
        fullPictureField,
        fullPictureFieldPartialEnterprise
      )

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importPictureFieldPartialFromEnterprise(
        mockContext,
        minimalPictureField,
        minimalPictureFieldPartialEnterprise
      )

      expect(result).toEqual(minimalPictureField)
    })
  })
})
