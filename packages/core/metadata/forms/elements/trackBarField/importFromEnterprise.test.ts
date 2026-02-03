import { describe, expect, it } from "vitest"
import {
  fullTrackBarField,
  fullTrackBarFieldPartialEnterprise,
  fullTrackBarFieldTypedEnterprise,
  minimalTrackBarField,
  minimalTrackBarFieldTypedEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importTrackBarFieldPartialFromEnterprise,
  importTrackBarFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importTrackBarFieldFromEnterprise", () => {
  describe("importTrackBarFieldTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importTrackBarFieldTypedFromEnterprise(mockContext, mockRule, undefined, "ПолеПолосыПрокрутки")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importTrackBarFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullTrackBarFieldTypedEnterprise,
        "ПолеПолосыПрокрутки"
      )

      expect(result).toEqual(fullTrackBarField)
    })

    it("should import minimal", () => {
      const result = importTrackBarFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalTrackBarFieldTypedEnterprise,
        "ПолеПолосыПрокрутки"
      )

      expect(result).toEqual(minimalTrackBarField)
    })
  })

  describe("importTrackBarFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importTrackBarFieldPartialFromEnterprise(mockContext, mockRule,  undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importTrackBarFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        fullTrackBarField,
        fullTrackBarFieldPartialEnterprise
      )

      expect(result).toEqual(fullTrackBarField)
    })
  })
})
