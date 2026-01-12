import { describe, expect, it } from "vitest"
import {
  fullLabelField,
  fullLabelFieldPartialEnterprise,
  fullLabelFieldTypedEnterprise,
  minimalLabelField,
  minimalLabelFieldPartialEnterprise,
  minimalLabelFieldTypedEnterprise,
} from "~/tests/fixtures/forms/labelField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importLabelFieldPartialFromEnterprise,
  importLabelFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importLabelFieldFromEnterprise", () => {
  describe("importLabelFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importLabelFieldTypedFromEnterprise(mockСontext, undefined, "ПолеНадписи")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importLabelFieldTypedFromEnterprise(
        mockСontext,
        fullLabelFieldTypedEnterprise,
        "ПолеНадписи"
      )

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importLabelFieldTypedFromEnterprise(
        mockСontext,
        minimalLabelFieldTypedEnterprise,
        "ПолеНадписи"
      )

      expect(result).toEqual(minimalLabelField)
    })
  })

  describe("importLabelFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importLabelFieldPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importLabelFieldPartialFromEnterprise(
        mockСontext,
        fullLabelField,
        fullLabelFieldPartialEnterprise
      )

      expect(result).toEqual(fullLabelField)
    })

    it("should import minimal", () => {
      const result = importLabelFieldPartialFromEnterprise(
        mockСontext,
        minimalLabelField,
        minimalLabelFieldPartialEnterprise
      )

      expect(result).toEqual(minimalLabelField)
    })
  })
})
