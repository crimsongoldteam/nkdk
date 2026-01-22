import { describe, expect, it } from "vitest"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  fullSingleSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
  minimalSingleSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportSearchStringAdditionPartialToEnterprise,
  exportSingleSearchStringAdditionToEnterprise,
} from "./exportToEnterprise"

describe("exportSearchStringAdditionToEnterprise", () => {
  describe("exportSingleSearchStringAdditionToEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportSingleSearchStringAdditionToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportSingleSearchStringAdditionToEnterprise(mockСontext, fullSingleSearchStringAddition)

      expect(result).toEqual(fullSingleSearchStringAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSingleSearchStringAdditionToEnterprise(mockСontext, minimalSingleSearchStringAddition)

      expect(result).toBeUndefined()
    })
  })

  describe("exportSearchStringAdditionToEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportSearchStringAdditionPartialToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportSearchStringAdditionPartialToEnterprise(mockСontext, fullSearchStringAddition)

      expect(result).toEqual(fullSingleSearchStringAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSearchStringAdditionPartialToEnterprise(mockСontext, minimalSearchStringAddition)

      expect(result).toBeUndefined()
    })
  })
})
