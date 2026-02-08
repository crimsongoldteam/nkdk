import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import { fullPage, fullPagePartialEnterprise, minimalPage } from "~/tests/fixtures/forms/page/data"
import { mockContext } from "~/tests/mockContext"

describe("importPageFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.Page,
      data: fullPagePartialEnterprise,
      source: fullPage,
    })

    expect(result).toEqual(fullPage)
  })

  it("should import minimal", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.Page,
      data: fullPagePartialEnterprise,
      source: fullPage,
    })

    expect(result).toEqual(minimalPage)
  })
})
