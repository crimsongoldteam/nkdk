import { describe, expect, it } from "vitest"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialEnterprise,
  fullCheckBoxFieldTypedEnterprise,
  minimalCheckBoxField,
  minimalCheckBoxFieldPartialEnterprise,
  minimalCheckBoxFieldTypedEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"
import {
  importCheckBoxFieldPartialFromEnterprise,
  importCheckBoxFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importCheckBoxFieldFromEnterprise", () => {
  describe("importCheckBoxFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importCheckBoxFieldTypedFromEnterprise(mockContext, undefined, "Флажок")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importCheckBoxFieldTypedFromEnterprise(mockContext, fullCheckBoxFieldTypedEnterprise, "Флажок")

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importCheckBoxFieldTypedFromEnterprise(mockContext, minimalCheckBoxFieldTypedEnterprise, "Флажок")

      expect(result).toEqual(minimalCheckBoxField)
    })
  })

  describe("importCheckBoxFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importCheckBoxFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importCheckBoxFieldPartialFromEnterprise(
        mockContext,
        fullCheckBoxField,
        fullCheckBoxFieldPartialEnterprise
      )

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importCheckBoxFieldPartialFromEnterprise(
        mockContext,
        minimalCheckBoxField,
        minimalCheckBoxFieldPartialEnterprise
      )

      expect(result).toEqual(minimalCheckBoxField)
    })
  })
})
