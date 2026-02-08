import { describe, expect, it } from "vitest"
import {
  fullCommandBar,
  fullCommandBarPartialEnterprise,
  minimalCommandBar,
  minimalCommandBarPartialEnterprise,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"

describe("exportCommandBarToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullCommandBar })

      expect(result).toEqual(fullCommandBarPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalCommandBar })

      expect(result).toEqual(minimalCommandBarPartialEnterprise)
    })
  })
})
