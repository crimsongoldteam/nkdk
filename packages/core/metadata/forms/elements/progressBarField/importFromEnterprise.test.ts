import { describe, expect, it } from "vitest"
import {
  fullProgressBarField,
  fullProgressBarFieldPartialEnterprise,
  fullProgressBarFieldTypedEnterprise,
  minimalProgressBarField,
  minimalProgressBarFieldPartialEnterprise,
  minimalProgressBarFieldTypedEnterprise,
} from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"
import {
  importProgressBarFieldPartialFromEnterprise,
  importProgressBarFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importProgressBarFieldFromEnterprise", () => {
  describe("importProgressBarFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importProgressBarFieldTypedFromEnterprise(mockContext, undefined, "ПолеИндикатора")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importProgressBarFieldTypedFromEnterprise(
        mockContext,
        fullProgressBarFieldTypedEnterprise,
        "ПолеИндикатора"
      )

      expect(result).toEqual(fullProgressBarField)
    })

    it("should import minimal", () => {
      const result = importProgressBarFieldTypedFromEnterprise(
        mockContext,
        minimalProgressBarFieldTypedEnterprise,
        "ПолеИндикатора"
      )

      expect(result).toEqual(minimalProgressBarField)
    })
  })

  describe("importProgressBarFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importProgressBarFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importProgressBarFieldPartialFromEnterprise(
        mockContext,
        fullProgressBarField,
        fullProgressBarFieldPartialEnterprise
      )

      expect(result).toEqual(fullProgressBarField)
    })

    it("should import minimal", () => {
      const result = importProgressBarFieldPartialFromEnterprise(
        mockContext,
        minimalProgressBarField,
        minimalProgressBarFieldPartialEnterprise
      )

      expect(result).toEqual(minimalProgressBarField)
    })
  })
})
