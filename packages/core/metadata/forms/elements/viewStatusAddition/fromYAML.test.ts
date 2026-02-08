import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionPartialEnterprise,
  minimalViewStatusAddition,
  minimalViewStatusAdditionPartialEnterprise,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"

describe("importViewStatusAdditionFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.ViewStatusAddition,
      data: fullViewStatusAdditionPartialEnterprise,
      source: fullViewStatusAddition,
    })

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should import minimal", () => {
    const result = importElementFromYAMLPartial({
      context: mockContext,
      elementType: FormElementType.ViewStatusAddition,
      data: minimalViewStatusAdditionPartialEnterprise,
      source: minimalViewStatusAddition,
    })

    expect(result).toEqual(minimalViewStatusAddition)
  })
})
