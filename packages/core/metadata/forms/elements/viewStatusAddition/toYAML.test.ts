import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { fullViewStatusAddition, fullViewStatusAdditionEnterprise } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = {
  type: "ViewStatusAddition",
}

describe("exportViewStatusAdditionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: fullViewStatusAddition,
    })

    expect(result).toEqual(fullViewStatusAdditionEnterprise)
  })
})
