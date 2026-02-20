import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullUsualGroup,
  fullUsualGroupPartialEnterprise,
  minimalUsualGroup,
  minimalUsualGroupPartialEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("exportUsualGroupToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullUsualGroup })

      expect(result).toEqual(fullUsualGroupPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalUsualGroup })

      expect(result).toEqual(minimalUsualGroupPartialEnterprise)
    })
  })
})
