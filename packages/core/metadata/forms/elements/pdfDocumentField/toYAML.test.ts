import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullPDFDocumentField,
  fullPDFDocumentFieldPartialYAML,
  minimalPDFDocumentField,
} from "~/metadata/forms/elements/pdfDocumentField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportPDFDocumentFieldToYAML", () => {
  describe("exportElementToPartialYAML", () => {
    it("should export all fields to YAML", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullPDFDocumentField })

      expect(result).toEqual(fullPDFDocumentFieldPartialYAML)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalPDFDocumentField })

      expect(result).toBeUndefined()
    })
  })
})
