import { describe, expect, it } from "vitest"
import {
  fullLabelDecoration,
  fullLabelDecorationPartialEnterprise,
  fullLabelDecorationTypedEnterprise,
  minimalLabelDecoration,
  minimalLabelDecorationTypedEnterprise,
} from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext } from "~/tests/mockContext"
import {
  importLabelDecorationPartialFromEnterprise,
  importLabelDecorationTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importLabelDecorationFromEnterprise", () => {
  describe("importLabelDecorationTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importLabelDecorationTypedFromEnterprise(mockContext, undefined, "Надпись")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importLabelDecorationTypedFromEnterprise(
        mockContext,
        fullLabelDecorationTypedEnterprise,
        "Заголовок"
      )

      expect(result).toEqual(fullLabelDecoration)
    })

    it("should import minimal", () => {
      const result = importLabelDecorationTypedFromEnterprise(
        mockContext,
        minimalLabelDecorationTypedEnterprise,
        "Заголовок"
      )

      expect(result).toEqual(minimalLabelDecoration)
    })
  })

  describe("importLabelDecorationPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importLabelDecorationPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importLabelDecorationPartialFromEnterprise(
        mockContext,
        fullLabelDecoration,
        fullLabelDecorationPartialEnterprise
      )

      expect(result).toEqual(fullLabelDecoration)
    })
  })
})
