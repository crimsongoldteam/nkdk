import { describe, expect, it } from "vitest"
import { importPropertyFromEnterprise, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionEnterprise,
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
      sourceValue: fullViewStatusAdditionEnterprise,
    })

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should import minimal", () => {
    const result = importPropertyFromEnterprise({
      context: mockContext,
      rule: rule,
      value: minimalViewStatusAdditionEnterprise,
    })

    expect(result).toEqual(minimalViewStatusAddition)
  })
})
