import { describe, expect, it } from "vitest"
import {
  fullProgressBarField,
  fullProgressBarFieldPartialEnterprise,
  fullProgressBarFieldTypedEnterprise,
  minimalProgressBarField,
  minimalProgressBarFieldPartialEnterprise,
  minimalProgressBarFieldTypedEnterprise,
} from "~/tests/fixtures/forms/progressBarField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportProgressBarFieldPartialToEnterprise,
  exportProgressBarFieldTypedToEnterprise,
} from "./exportToEnterprise"

describe("exportProgressBarFieldToEnterprise", () => {
  describe("exportProgressBarFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportProgressBarFieldPartialToEnterprise(mockСontext, fullProgressBarField)

      expect(result).toEqual(fullProgressBarFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportProgressBarFieldPartialToEnterprise(mockСontext, minimalProgressBarField)

      expect(result).toEqual(minimalProgressBarFieldPartialEnterprise)
    })
  })

  describe("exportProgressBarFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportProgressBarFieldTypedToEnterprise(mockСontext, fullProgressBarField)

      expect(result).toEqual(fullProgressBarFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportProgressBarFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
