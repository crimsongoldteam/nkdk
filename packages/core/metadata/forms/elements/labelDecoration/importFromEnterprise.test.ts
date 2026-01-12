import { describe, expect, it } from "vitest"
import {
  fullLabelDecoration,
  fullLabelDecorationPartialEnterprise,
  fullLabelDecorationTypedEnterprise,
  minimalLabelDecoration,
  minimalLabelDecorationTypedEnterprise,
} from "~/tests/fixtures/forms/labelDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { importLabelDecorationPartialFromEnterprise, importLabelDecorationTypedFromEnterprise } from "./importFromEnterprise"

describe("importLabelDecorationFromEnterprise", () => {
  describe("importLabelDecorationTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importLabelDecorationTypedFromEnterprise(mockСontext, undefined, "Надпись")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importLabelDecorationTypedFromEnterprise(mockСontext, fullLabelDecorationTypedEnterprise, "Надпись")

      expect(result).toEqual(fullLabelDecoration)
    })

    it("should import minimal", () => {
      const result = importLabelDecorationTypedFromEnterprise(
        mockСontext,
        minimalLabelDecorationTypedEnterprise,
        "Надпись"
      )

      expect(result).toEqual(minimalLabelDecoration)
    })
  })

  describe("importLabelDecorationPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importLabelDecorationPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importLabelDecorationPartialFromEnterprise(
        mockСontext,
        fullLabelDecoration,
        fullLabelDecorationPartialEnterprise
      )

      expect(result).toEqual(fullLabelDecoration)
    })
  })
})

