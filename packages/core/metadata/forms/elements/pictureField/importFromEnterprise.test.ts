import { describe, expect, it } from "vitest"
import {
  fullPictureField,
  fullPictureFieldPartialEnterprise,
  fullPictureFieldTypedEnterprise,
  minimalPictureField,
  minimalPictureFieldPartialEnterprise,
  minimalPictureFieldTypedEnterprise,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockСontext } from "~/tests/mockContext"
import { importPictureFieldPartialFromEnterprise, importPictureFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importPictureFieldFromEnterprise", () => {
  describe("importPictureFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPictureFieldTypedFromEnterprise(mockСontext, undefined, "ПолеКартинки")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPictureFieldTypedFromEnterprise(mockСontext, fullPictureFieldTypedEnterprise, "ПолеКартинки")

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importPictureFieldTypedFromEnterprise(
        mockСontext,
        minimalPictureFieldTypedEnterprise,
        "ПолеКартинки"
      )

      expect(result).toEqual(minimalPictureField)
    })
  })

  describe("importPictureFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importPictureFieldPartialFromEnterprise(mockСontext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importPictureFieldPartialFromEnterprise(
        mockСontext,
        fullPictureField,
        fullPictureFieldPartialEnterprise
      )

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importPictureFieldPartialFromEnterprise(
        mockСontext,
        minimalPictureField,
        minimalPictureFieldPartialEnterprise
      )

      expect(result).toEqual(minimalPictureField)
    })
  })
})
