import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import {
  fullAutoCommandBar,
  fullAutoCommandBarPartialEnterprise,
  minimalAutoCommandBar,
  minimalAutoCommandBarPartialEnterprise,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"

describe("importAutoCommandBarFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.AutoCommandBar,
      data: fullAutoCommandBarPartialEnterprise,
      source: fullAutoCommandBar,
    })

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.AutoCommandBar,
      data: minimalAutoCommandBarPartialEnterprise,
      source: minimalAutoCommandBar,
    })

    expect(result).toEqual(minimalAutoCommandBar)
  })
})
