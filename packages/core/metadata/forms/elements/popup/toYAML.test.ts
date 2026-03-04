import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/orchestration"
import {
  fullPopup,
  fullPopupPartialYAML,
  fullPopupTypedYAML,
  minimalPopup,
  minimalPopupTypedYAML,
} from "~/tests/fixtures/forms/popup/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPopupToYAML", () => {
  describe("Partial", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullPopup })

      expect(result).toEqual(fullPopupPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalPopup })

      expect(result).toBeUndefined()
    })
  })

  describe("Typed", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullPopup })

      expect(result).toEqual(fullPopupTypedYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: minimalPopup })

      expect(result).toEqual(minimalPopupTypedYAML)
    })
  })
})
