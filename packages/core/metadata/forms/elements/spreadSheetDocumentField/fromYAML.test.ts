import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldPartialYAML,
  minimalSpreadSheetDocumentField,
  minimalSpreadSheetDocumentFieldPartialYAML,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importSpreadSheetDocumentFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.SpreadSheetDocumentField,
      yaml: fullSpreadSheetDocumentFieldPartialYAML,
      source: fullSpreadSheetDocumentField,
    })

    expect(result).toEqual(fullSpreadSheetDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.SpreadSheetDocumentField,
      yaml: minimalSpreadSheetDocumentFieldPartialYAML,
      source: minimalSpreadSheetDocumentField,
    })

    expect(result).toEqual(minimalSpreadSheetDocumentField)
  })
})
