import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionPartialEnterprise,
  minimalViewStatusAddition,
  minimalViewStatusAdditionPartialEnterprise,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"

describe("importViewStatusAdditionFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      elementType: FormElementType.ViewStatusAddition,
      yaml: fullViewStatusAdditionPartialEnterprise,
      source: fullViewStatusAddition,
    })

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      elementType: FormElementType.ViewStatusAddition,
      yaml: minimalViewStatusAdditionPartialEnterprise,
      source: minimalViewStatusAddition,
    })

    expect(result).toEqual(minimalViewStatusAddition)
  })
})
