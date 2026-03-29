import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldPartialYAML,
  minimalSpreadSheetDocumentField,
} from "~/metadata/forms/elements/spreadSheetDocumentField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportSpreadSheetDocumentFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullSpreadSheetDocumentField })

    expect(result).toEqual(fullSpreadSheetDocumentFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalSpreadSheetDocumentField })

    expect(result).toBeUndefined()
  })
})
