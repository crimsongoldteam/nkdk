import { describe, expect, it } from "vitest"
import {
  fullDendrogramField,
  fullDendrogramFieldPartialEnterprise,
  fullDendrogramFieldTypedEnterprise,
  minimalDendrogramField,
  minimalDendrogramFieldPartialEnterprise,
  minimalDendrogramFieldTypedEnterprise,
} from "~/tests/fixtures/forms/dendrogramField/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importDendrogramFieldPartialFromEnterprise,
  importDendrogramFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importDendrogramFieldFromEnterprise", () => {
  describe("importDendrogramFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importDendrogramFieldTypedFromEnterprise(mockСontext, undefined, "ПолеДендрограммы")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importDendrogramFieldTypedFromEnterprise(
        mockСontext,
        fullDendrogramFieldTypedEnterprise,
        "ПолеДендрограммы"
      )

      expect(result).toEqual(fullDendrogramField)
    })

    it("should import minimal", () => {
      const result = importDendrogramFieldTypedFromEnterprise(
        mockСontext,
        minimalDendrogramFieldTypedEnterprise,
        "ПолеДендрограммы"
      )

      expect(result).toEqual(minimalDendrogramField)
    })
  })

  describe("importDendrogramFieldPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importDendrogramFieldPartialFromEnterprise(mockСontext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importDendrogramFieldPartialFromEnterprise(
        mockСontext,
        fullDendrogramField,
        fullDendrogramFieldPartialEnterprise
      )

      expect(result).toEqual(fullDendrogramField)
    })

    it("should import minimal", () => {
      const result = importDendrogramFieldPartialFromEnterprise(
        mockСontext,
        minimalDendrogramField,
        minimalDendrogramFieldPartialEnterprise
      )

      expect(result).toEqual(minimalDendrogramField)
    })
  })
})
