import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import { fullPages, fullPagesPartialEnterprise } from "~/tests/fixtures/forms/pages/data"
import { mockContext } from "~/tests/mockContext"

describe("importPagesFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      elementType: FormElementType.Pages,
      data: fullPagesPartialEnterprise,
      source: fullPages,
    })

    expect(result).toEqual(fullPages)
  })
})
