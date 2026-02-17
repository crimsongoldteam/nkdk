import { describe, expect, it } from "vitest"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionEnterprise,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = { type: "ViewStatusAddition" }

describe("importViewStatusAdditionFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: fullViewStatusAdditionEnterprise,
    })

    expect(result).toEqual(fullViewStatusAddition)
  })

  // it("should import minimal", () => {
  //   const result = importPropertyFromEnterprise({
  //     context: mockContext,
  //     rule: rule,
  //     value: minimalViewStatusAdditionEnterprise,
  //   })

  //   expect(result).toBeUndefined()
  // })
})
