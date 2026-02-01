import { describe, expect, it } from "vitest"
import {
  fullLabelField,
  fullLabelFieldPartialEnterprise,
  fullLabelFieldTypedEnterprise,
  minimalLabelField,
  minimalLabelFieldPartialEnterprise,
  minimalLabelFieldTypedEnterprise,
} from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"
import { importLabelFieldPartialFromEnterprise, importLabelFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importLabelFieldFromEnterprise", () => {
  describe("importLabelFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importLabelFieldTypedFromEnterprise(mockContext, undefined, "ПолеНадписи")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importLabelFieldTypedFromEnterprise(mockContext, fullLabelFieldTypedEnterprise, "ПолеНадписи")

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importLabelFieldTypedFromEnterprise(mockContext, minimalLabelFieldTypedEnterprise, "ПолеНадписи")

      expect(result).toEqual(minimalLabelField)
    })
  })

  describe("importLabelFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importLabelFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importLabelFieldPartialFromEnterprise(mockContext, fullLabelField, fullLabelFieldPartialEnterprise)

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importLabelFieldPartialFromEnterprise(
        mockContext,
        minimalLabelField,
        minimalLabelFieldPartialEnterprise
      )

      expect(result).toEqual(minimalLabelField)
    })
  })
})
