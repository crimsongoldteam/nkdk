import { describe, expect, it } from "vitest"
import {
  fullFormItemAddition,
  fullFormItemAdditionPartialEnterprise,
  fullFormItemAdditionTypedEnterprise,
  minimalFormItemAddition,
  minimalFormItemAdditionPartialEnterprise,
  minimalFormItemAdditionTypedEnterprise,
} from "~/tests/fixtures/forms/formItemAddition/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importFormItemAdditionPartialFromEnterprise,
  importFormItemAdditionTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importFormItemAdditionFromEnterprise", () => {
  describe("importFormItemAdditionTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importFormItemAdditionTypedFromEnterprise(mockСontext, undefined, fullFormItemAddition.name)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importFormItemAdditionTypedFromEnterprise(
        mockСontext,
        fullFormItemAdditionTypedEnterprise,
        fullFormItemAddition.name
      )

      expect(result).toEqual(fullFormItemAddition)
    })

    it("should import minimal", () => {
      const result = importFormItemAdditionTypedFromEnterprise(
        mockСontext,
        minimalFormItemAdditionTypedEnterprise,
        minimalFormItemAddition.name
      )

      expect(result).toEqual(minimalFormItemAddition)
    })
  })

  describe("importFormItemAdditionPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importFormItemAdditionPartialFromEnterprise(
        mockСontext,
        undefined,
        fullFormItemAdditionPartialEnterprise
      )

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importFormItemAdditionPartialFromEnterprise(
        mockСontext,
        fullFormItemAddition,
        fullFormItemAdditionPartialEnterprise
      )

      expect(result).toEqual(fullFormItemAddition)
    })

    it("should import minimal", () => {
      const result = importFormItemAdditionPartialFromEnterprise(
        mockСontext,
        fullFormItemAddition,
        minimalFormItemAdditionPartialEnterprise
      )

      expect(result).toEqual(fullFormItemAddition)
    })
  })
})

