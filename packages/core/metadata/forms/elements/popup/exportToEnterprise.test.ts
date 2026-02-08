import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPopup,
  fullPopupPartialEnterprise,
  minimalPopup,
  minimalPopupPartialEnterprise,
} from "~/tests/fixtures/forms/popup/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPopupToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullPopup })

      expect(result).toEqual(fullPopupPartialEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalPopup })

      expect(result).toEqual(minimalPopupPartialEnterprise)
    })
  })
})
