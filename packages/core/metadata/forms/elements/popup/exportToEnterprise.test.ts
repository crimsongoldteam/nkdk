import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/metadataFactory"
import {
  fullPopup,
  fullPopupPartialEnterprise,
  fullPopupTypedEnterprise,
  minimalPopup,
  minimalPopupPartialEnterprise,
  minimalPopupTypedEnterprise,
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

  describe("exportElementToTypedYAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullPopup })

      expect(result).toEqual(fullPopupTypedEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: minimalPopup })

      expect(result).toEqual(minimalPopupTypedEnterprise)
    })
  })
})
