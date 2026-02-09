import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldPartialEnterprise,
  minimalSpreadSheetDocumentField,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportSpreadSheetDocumentFieldToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullSpreadSheetDocumentField })

    expect(result).toEqual(fullSpreadSheetDocumentFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalSpreadSheetDocumentField })

    expect(result).toBeUndefined()
  })
})
