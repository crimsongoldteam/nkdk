import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/orchestration"
import {
  fullPictureField,
  fullPictureFieldPartialYAML,
  minimalPictureField,
  fullTablePictureField,
  fullTablePictureFieldTypedYAML,
  minimalTablePictureField,
  minimalTablePictureFieldTypedYAML,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPictureFieldToYAML", () => {
  describe("PictureField partial", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullPictureField })

      expect(result).toEqual(fullPictureFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalPictureField })

      expect(result).toBeUndefined()
    })
  })

  describe("TablePictureField typed", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: fullTablePictureField })

      expect(result).toEqual(fullTablePictureFieldTypedYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToTypedYAML({ context: mockContext, element: minimalTablePictureField })

      expect(result).toEqual(minimalTablePictureFieldTypedYAML)
    })
  })
})
