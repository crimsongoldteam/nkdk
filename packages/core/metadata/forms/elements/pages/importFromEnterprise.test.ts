import { describe, expect, it } from "vitest"
import {
  fullPages,
  fullPagesPartialEnterprise,
  fullPagesTypedEnterprise,
  minimalPages,
  minimalPagesPartialEnterprise,
  minimalPagesTypedEnterprise,
} from "~/tests/fixtures/forms/pages/data"
import { mockСontext } from "~/tests/mockContext"
import { importPagesPartialFromEnterprise, importPagesTypedFromEnterprise } from "./importFromEnterprise"

describe("importPagesFromEnterprise", () => {
  describe("importPagesTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPagesTypedFromEnterprise(mockСontext, undefined, "Страницы")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPagesTypedFromEnterprise(mockСontext, fullPagesTypedEnterprise, "Страницы")

      expect(result).toEqual(fullPages)
    })

    it("should import minimal", () => {
      const result = importPagesTypedFromEnterprise(mockСontext, minimalPagesTypedEnterprise, "Страницы")

      expect(result).toEqual(minimalPages)
    })
  })

  describe("importPagesPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importPagesPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPagesPartialFromEnterprise(
        mockСontext,
        fullPages,
        fullPagesPartialEnterprise
      )

      expect(result).toEqual(fullPages)
    })
  })
})

