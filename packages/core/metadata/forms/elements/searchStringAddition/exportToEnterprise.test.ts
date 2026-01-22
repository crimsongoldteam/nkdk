import { describe, expect, it } from "vitest"
import {
  fullSearchStringAdditionEnterprise,
  fullSingleSearchStringAddition,
  minimalSingleSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportSearchStringAdditionToEnterprise,
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

      expect(result).toEqual(fullSearchStringAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSingleSearchStringAdditionToEnterprise(mockСontext, minimalSingleSearchStringAddition)

      expect(result).toBeUndefined()
    })
  })

  describe("exportSearchStringAdditionToEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportSearchStringAdditionToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportSearchStringAdditionToEnterprise(mockСontext, fullSingleSearchStringAddition)

      expect(result).toEqual(fullSearchStringAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportSearchStringAdditionToEnterprise(mockСontext, minimalSingleSearchStringAddition)

      expect(result).toBeUndefined()
    })
  })
})
