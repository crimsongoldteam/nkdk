import { describe, expect, it } from "vitest"
import {
  fullPeriodField,
  fullPeriodFieldPartialEnterprise,
  fullPeriodFieldTypedEnterprise,
  minimalPeriodField,
  minimalPeriodFieldPartialEnterprise,
  minimalPeriodFieldTypedEnterprise,
} from "~/tests/fixtures/forms/periodField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importPeriodFieldPartialFromEnterprise, importPeriodFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importPeriodFieldFromEnterprise", () => {
  describe("importPeriodFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPeriodFieldTypedFromEnterprise(mockContext, mockRule, undefined, "ПолеПериода")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPeriodFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullPeriodFieldTypedEnterprise,
        "ПолеПериода"
      )

      expect(result).toEqual(fullPeriodField)
    })

    it("should import minimal", () => {
      const result = importPeriodFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalPeriodFieldTypedEnterprise,
        "ПолеПериода"
      )

      expect(result).toEqual(minimalPeriodField)
    })
  })

  describe("importPeriodFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPeriodFieldPartialFromEnterprise(mockContext, mockRule, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPeriodFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullPeriodField,
        fullPeriodFieldPartialEnterprise
      )

      expect(result).toEqual(fullPeriodField)
    })

    it("should import minimal", () => {
      const result = importPeriodFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalPeriodField,
        minimalPeriodFieldPartialEnterprise
      )

      expect(result).toEqual(minimalPeriodField)
    })
  })
})
