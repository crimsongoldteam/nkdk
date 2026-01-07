import { describe, expect, it } from "vitest"
import { fullFormItemAddition, fullFormItemAdditionEnterprise, minimalFormItemAddition, minimalFormItemAdditionEnterprise } from "~/tests/fixtures/forms/formItemAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFormItemAdditionToEnterprise } from "./exportToEnterprise"

describe("exportFormItemAdditionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormItemAdditionToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportFormItemAdditionToEnterprise(mockСontext, fullFormItemAddition)

    expect(result).toEqual(fullFormItemAdditionEnterprise)
  })

  it("should export minimal", () => {
    const result = exportFormItemAdditionToEnterprise(mockСontext, minimalFormItemAddition)

    expect(result).toEqual(minimalFormItemAdditionEnterprise)
  })
})

