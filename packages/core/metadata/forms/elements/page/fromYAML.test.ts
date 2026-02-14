import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPage,
  fullPagePartialEnterprise,
  minimalPage,
  minimalPagePartialEnterprise,
} from "~/tests/fixtures/forms/page/data"
import { mockContext } from "~/tests/mockContext"

describe("importPageFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.Page,
      yaml: fullPagePartialEnterprise,
      source: fullPage,
    })

    expect(result).toEqual(fullPage)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.Page,
      yaml: minimalPagePartialEnterprise,
      source: minimalPage,
    })

    expect(result).toEqual(minimalPage)
  })
})
