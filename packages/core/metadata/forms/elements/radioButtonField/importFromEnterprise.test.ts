import { describe, expect, it } from "vitest"
import {
  fullRadioButtonField,
  fullRadioButtonFieldPartialEnterprise,
  fullRadioButtonFieldTypedEnterprise,
  minimalRadioButtonField,
  minimalRadioButtonFieldPartialEnterprise,
  minimalRadioButtonFieldTypedEnterprise,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext } from "~/tests/mockContext"
import {
  importRadioButtonFieldPartialFromEnterprise,
  importRadioButtonFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importRadioButtonFieldFromEnterprise", () => {
  describe("importRadioButtonFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importRadioButtonFieldTypedFromEnterprise(mockContext, undefined, "ПолеПереключателя")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importRadioButtonFieldTypedFromEnterprise(
        mockContext,
        fullRadioButtonFieldTypedEnterprise,
        "ПолеПереключателя"
      )

      expect(result).toEqual(fullRadioButtonField)
    })

    it("should import minimal", () => {
      const result = importRadioButtonFieldTypedFromEnterprise(
        mockContext,
        minimalRadioButtonFieldTypedEnterprise,
        "ПолеПереключателя"
      )

      expect(result).toEqual(minimalRadioButtonField)
    })
  })

  describe("importRadioButtonFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importRadioButtonFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importRadioButtonFieldPartialFromEnterprise(
        mockContext,
        fullRadioButtonField,
        fullRadioButtonFieldPartialEnterprise
      )

      expect(result).toEqual(fullRadioButtonField)
    })

    it("should import minimal", () => {
      const result = importRadioButtonFieldPartialFromEnterprise(
        mockContext,
        minimalRadioButtonField,
        minimalRadioButtonFieldPartialEnterprise
      )

      expect(result).toEqual(minimalRadioButtonField)
    })
  })
})
