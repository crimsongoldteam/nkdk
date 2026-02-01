import { describe, expect, it } from "vitest"
import {
  fullDendrogramField,
  fullDendrogramFieldPartialEnterprise,
  fullDendrogramFieldTypedEnterprise,
  minimalDendrogramField,
  minimalDendrogramFieldPartialEnterprise,
  minimalDendrogramFieldTypedEnterprise,
} from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext } from "~/tests/mockContext"
import {
  importDendrogramFieldPartialFromEnterprise,
  importDendrogramFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importDendrogramFieldFromEnterprise", () => {
  describe("importDendrogramFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importDendrogramFieldTypedFromEnterprise(mockContext, undefined, "ПолеДендрограммы")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importDendrogramFieldTypedFromEnterprise(
        mockContext,
        fullDendrogramFieldTypedEnterprise,
        "ПолеДендрограммы"
      )

      expect(result).toEqual(fullDendrogramField)
    })

    it("should import minimal", () => {
      const result = importDendrogramFieldTypedFromEnterprise(
        mockContext,
        minimalDendrogramFieldTypedEnterprise,
        "ПолеДендрограммы"
      )

      expect(result).toEqual(minimalDendrogramField)
    })
  })

  describe("importDendrogramFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importDendrogramFieldPartialFromEnterprise(mockContext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importDendrogramFieldPartialFromEnterprise(
        mockContext,
        fullDendrogramField,
        fullDendrogramFieldPartialEnterprise
      )

      expect(result).toEqual(fullDendrogramField)
    })

    it("should import minimal", () => {
      const result = importDendrogramFieldPartialFromEnterprise(
        mockContext,
        minimalDendrogramField,
        minimalDendrogramFieldPartialEnterprise
      )

      expect(result).toEqual(minimalDendrogramField)
    })
  })
})
