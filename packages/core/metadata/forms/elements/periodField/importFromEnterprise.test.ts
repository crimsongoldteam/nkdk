import { describe, expect, it } from "vitest"
import {
  fullPeriodField,
  fullPeriodFieldPartialEnterprise,
  fullPeriodFieldTypedEnterprise,
  minimalPeriodField,
  minimalPeriodFieldPartialEnterprise,
  minimalPeriodFieldTypedEnterprise,
} from "~/tests/fixtures/forms/periodField/data"
import { mockContext } from "~/tests/mockContext"
import { importPeriodFieldPartialFromEnterprise, importPeriodFieldTypedFromEnterprise } from "./importFromEnterprise"

describe("importPeriodFieldFromEnterprise", () => {
  describe("importPeriodFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPeriodFieldTypedFromEnterprise(mockContext, undefined, "ПолеПериода")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPeriodFieldTypedFromEnterprise(mockContext, fullPeriodFieldTypedEnterprise, "ПолеПериода")

      expect(result).toEqual(fullPeriodField)
    })

    it("should import minimal", () => {
      const result = importPeriodFieldTypedFromEnterprise(mockContext, minimalPeriodFieldTypedEnterprise, "ПолеПериода")

      expect(result).toEqual(minimalPeriodField)
    })
  })

  describe("importPeriodFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPeriodFieldPartialFromEnterprise(mockContext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPeriodFieldPartialFromEnterprise(
        mockContext,
        fullPeriodField,
        fullPeriodFieldPartialEnterprise
      )

      expect(result).toEqual(fullPeriodField)
    })

    it("should import minimal", () => {
      const result = importPeriodFieldPartialFromEnterprise(
        mockContext,
        minimalPeriodField,
        minimalPeriodFieldPartialEnterprise
      )

      expect(result).toEqual(minimalPeriodField)
    })
  })
})
