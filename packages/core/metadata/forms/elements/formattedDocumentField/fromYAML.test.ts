import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/metadataFactory"
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
      itemType: "FormattedDocumentField",
      yaml: fullFormattedDocumentFieldPartialYAML,
      source: fullFormattedDocumentField,
    })

    expect(result).toEqual(fullFormattedDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "FormattedDocumentField",
      yaml: minimalFormattedDocumentFieldPartialYAML,
      source: minimalFormattedDocumentField,
    })

    expect(result).toEqual(minimalFormattedDocumentField)
  })
})
