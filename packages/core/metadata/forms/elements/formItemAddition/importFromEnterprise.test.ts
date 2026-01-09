import { describe, expect, it } from "vitest"
import { fullFormItemAddition, fullFormItemAdditionEnterprise, minimalFormItemAddition, minimalFormItemAdditionEnterprise } from "~/tests/fixtures/forms/formItemAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { importFormItemAdditionFromEnterprise } from "./importFromEnterprise"

describe("importFormItemAdditionFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormItemAdditionFromEnterprise(mockСontext, undefined, fullFormItemAddition.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importFormItemAdditionFromEnterprise(mockСontext, fullFormItemAdditionEnterprise, fullFormItemAddition.name)

    expect(result).toEqual(fullFormItemAddition)
  })

  it("should import minimal", () => {
    const result = importFormItemAdditionFromEnterprise(mockСontext, minimalFormItemAdditionEnterprise, minimalFormItemAddition.name)

    expect(result).toEqual(minimalFormItemAddition)
  })
})

