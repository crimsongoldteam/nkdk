import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldPartialEnterprise,
  minimalSpreadSheetDocumentField,
  minimalSpreadSheetDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importSpreadSheetDocumentFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.SpreadSheetDocumentField,
      yaml: fullSpreadSheetDocumentFieldPartialEnterprise,
      source: fullSpreadSheetDocumentField,
    })

    expect(result).toEqual(fullSpreadSheetDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.SpreadSheetDocumentField,
      yaml: minimalSpreadSheetDocumentFieldPartialEnterprise,
      source: minimalSpreadSheetDocumentField,
    })

    expect(result).toEqual(minimalSpreadSheetDocumentField)
  })
})
