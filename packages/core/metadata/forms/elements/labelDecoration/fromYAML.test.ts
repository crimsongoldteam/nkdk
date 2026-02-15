import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import { fullLabelDecoration, fullLabelDecorationPartialEnterprise } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("importLabelDecorationFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.LabelDecoration,
      yaml: fullLabelDecorationPartialEnterprise,
      source: fullLabelDecoration,
    })

    expect(result).toEqual(fullLabelDecoration)
  })
})
