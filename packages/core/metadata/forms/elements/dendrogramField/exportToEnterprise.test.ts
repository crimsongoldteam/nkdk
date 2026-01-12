import { describe, expect, it } from "vitest"
import {
  fullDendrogramField,
  fullDendrogramFieldPartialEnterprise,
  fullDendrogramFieldTypedEnterprise,
  minimalDendrogramField,
  minimalDendrogramFieldPartialEnterprise,
} from "~/tests/fixtures/forms/dendrogramField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportDendrogramFieldPartialToEnterprise, exportDendrogramFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportDendrogramFieldToEnterprise", () => {
  describe("exportDendrogramFieldPartialToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportDendrogramFieldPartialToEnterprise(mockСontext, fullDendrogramField)

      expect(result).toEqual(fullDendrogramFieldPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportDendrogramFieldPartialToEnterprise(mockСontext, minimalDendrogramField)

      expect(result).toEqual(minimalDendrogramFieldPartialEnterprise)
    })
  })

  describe("exportDendrogramFieldTypedToEnterprise", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportDendrogramFieldTypedToEnterprise(mockСontext, fullDendrogramField)

      expect(result).toEqual(fullDendrogramFieldTypedEnterprise)
    })

    it("should return undefined when data is undefined", () => {
      const result = exportDendrogramFieldTypedToEnterprise(mockСontext, undefined)

      expect(result).toBeUndefined()
    })
  })
})
