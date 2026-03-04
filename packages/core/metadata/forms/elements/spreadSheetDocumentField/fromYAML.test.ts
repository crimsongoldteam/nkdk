import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
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
      itemType: "SpreadSheetDocumentField",
      yaml: fullSpreadSheetDocumentFieldPartialYAML,
      source: fullSpreadSheetDocumentField,
    })

    expect(result).toEqual(fullSpreadSheetDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "SpreadSheetDocumentField",
      yaml: minimalSpreadSheetDocumentFieldPartialYAML,
      source: minimalSpreadSheetDocumentField,
    })

    expect(result).toEqual(minimalSpreadSheetDocumentField)
  })
})
