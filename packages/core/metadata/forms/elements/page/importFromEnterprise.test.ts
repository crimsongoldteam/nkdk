import { describe, expect, it } from "vitest"
import {
  fullPage,
  fullPagePartialEnterprise,
  fullPageTypedEnterprise,
  minimalPage,
  minimalPagePartialEnterprise,
  minimalPageTypedEnterprise,
} from "~/tests/fixtures/forms/page/data"
import { mockСontext } from "~/tests/mockContext"
import { importPagePartialFromEnterprise, importPageTypedFromEnterprise } from "./importFromEnterprise"

describe("importPageFromEnterprise", () => {
  describe("importPageTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importPageTypedFromEnterprise(mockСontext, undefined, "Страница")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importPageTypedFromEnterprise(mockСontext, fullPageTypedEnterprise, "Страница")

      expect(result).toEqual(fullPage)
    })

    it("should import minimal", () => {
      const result = importPageTypedFromEnterprise(mockСontext, minimalPageTypedEnterprise, "Страница")

      expect(result).toEqual(minimalPage)
    })
  })

  describe("importPagePartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importPagePartialFromEnterprise(mockСontext, fullPage, fullPagePartialEnterprise)

      expect(result).toEqual(fullPage)
    })

    it("should import minimal", () => {
      const result = importPagePartialFromEnterprise(mockСontext, minimalPage, minimalPagePartialEnterprise)

      expect(result).toEqual(minimalPage)
    })
  })
})
