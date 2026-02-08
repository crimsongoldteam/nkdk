import { describe, expect, it } from "vitest"
import { importPropertyFromEnterprise, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionEnterprise,
  minimalViewStatusAddition,
  minimalViewStatusAdditionEnterprise,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = { type: "ViewStatusAddition" }

describe("importViewStatusAdditionFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importPropertyFromEnterprise({
      context: mockContext,
      rule: rule,
      value: fullViewStatusAdditionEnterprise,
      sourceValue: fullViewStatusAddition,
    })

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should import minimal", () => {
    const result = importPropertyFromEnterprise({
      context: mockContext,
      rule: rule,
      value: minimalViewStatusAdditionEnterprise,
      sourceValue: minimalViewStatusAddition,
    })

    expect(result).toEqual(minimalViewStatusAddition)
  })
})
