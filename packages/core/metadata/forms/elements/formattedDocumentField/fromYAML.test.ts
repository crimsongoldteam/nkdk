import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldPartialYAML,
  minimalFormattedDocumentField,
  minimalFormattedDocumentFieldPartialYAML,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importFormattedDocumentFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.FormattedDocumentField,
      yaml: fullFormattedDocumentFieldPartialYAML,
      source: fullFormattedDocumentField,
    })

    expect(result).toEqual(fullFormattedDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.FormattedDocumentField,
      yaml: minimalFormattedDocumentFieldPartialYAML,
      source: minimalFormattedDocumentField,
    })

    expect(result).toEqual(minimalFormattedDocumentField)
  })
})
