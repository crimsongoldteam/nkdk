import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import { fullLabelDecoration, fullLabelDecorationPartialYAML } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("importLabelDecorationFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.LabelDecoration,
      yaml: fullLabelDecorationPartialYAML,
      source: fullLabelDecoration,
    })

    expect(result).toEqual(fullLabelDecoration)
  })
})
