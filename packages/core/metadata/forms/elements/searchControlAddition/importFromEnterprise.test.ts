import { describe, expect, it } from "vitest"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionEnterprise,
  fullSingleSearchControlAddition,
  fullSingleSearchControlAdditionEnterprise,
  minimalSearchControlAddition,
  sourceSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importSearchControlAdditionPartialFromEnterprise,
  importSingleSearchControlAdditionFromEnterprise,
} from "./importFromEnterprise"

describe("importFromEnterprise", () => {
  describe("importSingleSearchControlAdditionFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importSingleSearchControlAdditionFromEnterprise(
        mockСontext,
        fullSingleSearchControlAdditionEnterprise
      )

      expect(result).toEqual(fullSingleSearchControlAddition)
    })

    it("should import minimal", () => {
      const result = importSingleSearchControlAdditionFromEnterprise(mockСontext, {})

      expect(result).toBeUndefined()
    })
  })

  describe("importSearchControlAdditionPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importSearchControlAdditionPartialFromEnterprise(
        mockСontext,
        sourceSearchControlAddition,
        fullSearchControlAdditionEnterprise
      )

      expect(result).toEqual(fullSearchControlAddition)
    })

    it("should import minimal", () => {
      const result = importSearchControlAdditionPartialFromEnterprise(mockСontext, sourceSearchControlAddition, {})

      expect(result).toEqual(minimalSearchControlAddition)
    })
  })
})
