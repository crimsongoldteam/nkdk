import { describe, expect, it } from "vitest"
import {
  fullSearchStringAddition,
  fullSingleSearchStringAddition,
  fullSingleSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
  minimalSingleSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"
import {
  exportSearchStringAdditionPartialToEnterprise,
  exportSingleSearchStringAdditionToEnterprise,
} from "./exportToEnterprise"

describe("exportSearchStringAdditionToEnterprise", () => {
  describe("exportSingleSearchStringAdditionToEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportSingleSearchStringAdditionToEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportSingleSearchStringAdditionToEnterprise(mockContext, fullSingleSearchStringAddition)

      expect(result).toEqual(fullSingleSearchStringAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSingleSearchStringAdditionToEnterprise(mockContext, minimalSingleSearchStringAddition)

      expect(result).toBeUndefined()
    })
  })

  describe("exportSearchStringAdditionToEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportSearchStringAdditionPartialToEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportSearchStringAdditionPartialToEnterprise(mockContext, fullSearchStringAddition)

      expect(result).toEqual(fullSingleSearchStringAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSearchStringAdditionPartialToEnterprise(mockContext, minimalSearchStringAddition)

      expect(result).toBeUndefined()
    })
  })
})
