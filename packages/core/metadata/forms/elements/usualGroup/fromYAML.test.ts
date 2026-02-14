import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullUsualGroup,
  fullUsualGroupPartialEnterprise,
  minimalUsualGroup,
  minimalUsualGroupPartialEnterprise,
} from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("importUsualGroupFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.UsualGroup,
      yaml: fullUsualGroupPartialEnterprise,
      source: fullUsualGroup,
    })

    expect(result).toEqual(fullUsualGroup)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: FormElementType.UsualGroup,
      yaml: minimalUsualGroupPartialEnterprise,
      source: minimalUsualGroup,
    })

    expect(result).toEqual(minimalUsualGroup)
  })
})
