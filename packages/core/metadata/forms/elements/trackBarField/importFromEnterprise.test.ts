import { describe, expect, it } from "vitest"
import {
  fullTrackBarField,
  fullTrackBarFieldPartialEnterprise,
  fullTrackBarFieldTypedEnterprise,
  minimalTrackBarField,
  minimalTrackBarFieldTypedEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"
import {
  importTrackBarFieldPartialFromEnterprise,
  importTrackBarFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importTrackBarFieldFromEnterprise", () => {
  describe("importTrackBarFieldTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importTrackBarFieldTypedFromEnterprise(mockContext, undefined, "ПолеПолосыПрокрутки")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importTrackBarFieldTypedFromEnterprise(
        mockContext,
        fullTrackBarFieldTypedEnterprise,
        "ПолеПолосыПрокрутки"
      )

      expect(result).toEqual(fullTrackBarField)
    })

    it("should import minimal", () => {
      const result = importTrackBarFieldTypedFromEnterprise(
        mockContext,
        minimalTrackBarFieldTypedEnterprise,
        "ПолеПолосыПрокрутки"
      )

      expect(result).toEqual(minimalTrackBarField)
    })
  })

  describe("importTrackBarFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importTrackBarFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importTrackBarFieldPartialFromEnterprise(
        mockContext,
        fullTrackBarField,
        fullTrackBarFieldPartialEnterprise
      )

      expect(result).toEqual(fullTrackBarField)
    })
  })
})
