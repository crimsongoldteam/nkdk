import { describe, expect, it } from "vitest"
import {
  fullTrackBarField,
  fullTrackBarFieldPartialEnterprise,
  fullTrackBarFieldTypedEnterprise,
  minimalTrackBarField,
  minimalTrackBarFieldTypedEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importTrackBarFieldPartialFromEnterprise,
  importTrackBarFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importTrackBarFieldFromEnterprise", () => {
  describe("importTrackBarFieldTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importTrackBarFieldTypedFromEnterprise(mockСontext, undefined, "ПолеПолосыПрокрутки")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importTrackBarFieldTypedFromEnterprise(
        mockСontext,
        fullTrackBarFieldTypedEnterprise,
        "ПолеПолосыПрокрутки"
      )

      expect(result).toEqual(fullTrackBarField)
    })

    it("should import minimal", () => {
      const result = importTrackBarFieldTypedFromEnterprise(
        mockСontext,
        minimalTrackBarFieldTypedEnterprise,
        "ПолеПолосыПрокрутки"
      )

      expect(result).toEqual(minimalTrackBarField)
    })
  })

  describe("importTrackBarFieldPartialFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importTrackBarFieldPartialFromEnterprise(mockСontext, undefined, undefined)

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importTrackBarFieldPartialFromEnterprise(
        mockСontext,
        fullTrackBarField,
        fullTrackBarFieldPartialEnterprise
      )

      expect(result).toEqual(fullTrackBarField)
    })
  })
})
