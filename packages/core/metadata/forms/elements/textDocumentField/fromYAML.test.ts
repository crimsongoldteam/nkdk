import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullTextDocumentField,
  fullTextDocumentFieldPartialYAML,
  minimalTextDocumentField,
  minimalTextDocumentFieldPartialYAML,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("importTextDocumentFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.TextDocumentField,
      yaml: fullTextDocumentFieldPartialYAML,
      source: fullTextDocumentField,
    })

    expect(result).toEqual(fullTextDocumentField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.TextDocumentField,
      yaml: minimalTextDocumentFieldPartialYAML,
      source: minimalTextDocumentField,
    })

    expect(result).toEqual(minimalTextDocumentField)
  })
})
