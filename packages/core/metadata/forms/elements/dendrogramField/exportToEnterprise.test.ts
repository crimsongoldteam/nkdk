import { describe, expect, it } from "vitest"
import {
  fullDendrogramField,
  fullDendrogramFieldPartialEnterprise,
  fullDendrogramFieldTypedEnterprise,
  minimalDendrogramField,
  minimalDendrogramFieldPartialEnterprise,
} from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext } from "~/tests/mockContext"
import { exportDendrogramFieldPartialToEnterprise, exportDendrogramFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportDendrogramFieldToEnterprise", () => {
  describe("exportDendrogramFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportDendrogramFieldPartialToEnterprise(mockContext, fullDendrogramField)

      expect(result).toEqual(fullDendrogramFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportDendrogramFieldPartialToEnterprise(mockContext, minimalDendrogramField)

      expect(result).toEqual(minimalDendrogramFieldPartialEnterprise)
    })
  })

  describe("exportDendrogramFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportDendrogramFieldTypedToEnterprise(mockContext, fullDendrogramField)

      expect(result).toEqual(fullDendrogramFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportDendrogramFieldTypedToEnterprise(mockContext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
