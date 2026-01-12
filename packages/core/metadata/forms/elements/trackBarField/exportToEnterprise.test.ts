import { describe, expect, it } from "vitest"
import {
  fullTrackBarField,
  fullTrackBarFieldPartialEnterprise,
  fullTrackBarFieldTypedEnterprise,
  minimalTrackBarField,
  minimalTrackBarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportTrackBarFieldPartialToEnterprise, exportTrackBarFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportTrackBarFieldToEnterprise", () => {
  describe("exportTrackBarFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportTrackBarFieldPartialToEnterprise(mockСontext, fullTrackBarField)

      expect(result).toEqual(fullTrackBarFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportTrackBarFieldPartialToEnterprise(mockСontext, minimalTrackBarField)

      expect(result).toEqual(minimalTrackBarFieldPartialEnterprise)
    })
  })

  describe("exportTrackBarFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportTrackBarFieldTypedToEnterprise(mockСontext, fullTrackBarField)

      expect(result).toEqual(fullTrackBarFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportTrackBarFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
