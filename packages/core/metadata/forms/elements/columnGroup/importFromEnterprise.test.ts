import { describe, expect, it } from "vitest"
import {
  fullColumnGroup,
  fullColumnGroupPartialEnterprise,
  fullColumnGroupTypedEnterprise,
  minimalColumnGroup,
  minimalColumnGroupTypedEnterprise,
} from "~/tests/fixtures/forms/columnGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { importColumnGroupPartialFromEnterprise, importColumnGroupTypedFromEnterprise } from "./importFromEnterprise"

describe("importColumnGroupFromEnterprise", () => {
  describe("importColumnGroupTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importColumnGroupTypedFromEnterprise(mockСontext, undefined, "ГруппаКолонок")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importColumnGroupTypedFromEnterprise(mockСontext, fullColumnGroupTypedEnterprise, "ГруппаКолонок")

      expect(result).toEqual(fullColumnGroup)
    })

    it("should import minimal", () => {
      const result = importColumnGroupTypedFromEnterprise(
        mockСontext,
        minimalColumnGroupTypedEnterprise,
        "ГруппаКолонок"
      )

      expect(result).toEqual(minimalColumnGroup)
    })
  })

  describe("importColumnGroupPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importColumnGroupPartialFromEnterprise(mockСontext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importColumnGroupPartialFromEnterprise(
        mockСontext,
        fullColumnGroup,
        fullColumnGroupPartialEnterprise
      )

      expect(result).toEqual(fullColumnGroup)
    })
  })
})
