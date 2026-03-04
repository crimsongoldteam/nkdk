import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import { fullUsualGroup, fullUsualGroupPartialYAML, minimalUsualGroup } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("exportUsualGroupToYAML", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullUsualGroup })

      expect(result).toEqual(fullUsualGroupPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalUsualGroup })

      expect(result).toBeUndefined()
    })
  })
})
