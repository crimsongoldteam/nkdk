import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldPartialEnterprise,
  minimalFormattedDocumentField,
  minimalFormattedDocumentFieldPartialEnterprise,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importFormattedDocumentFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.FormattedDocumentField,
      yaml: fullFormattedDocumentFieldPartialEnterprise,
      source: fullFormattedDocumentField,
    })

    expect(result).toEqual(fullFormattedDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.FormattedDocumentField,
      yaml: minimalFormattedDocumentFieldPartialEnterprise,
      source: minimalFormattedDocumentField,
    })

    expect(result).toEqual(minimalFormattedDocumentField)
  })
})
