import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/exportToEnterprise"
import "~/metadata/forms/elements/exportToEnterprise"
import "~/metadata/forms/elements/usualGroup/rules"
import "~/metadata/systemEnumerations/exportToEnterprise"
import {
  fullUsualGroup,
  fullUsualGroupPartialEnterprise,
  minimalUsualGroup,
  minimalUsualGroupPartialEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"

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
