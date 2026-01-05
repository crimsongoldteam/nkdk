import { describe, expect, it } from "vitest"
import { fullInputField, fullInputFieldEnterprise } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import { importInputFieldFromEnterprise } from "./importFromEnterprise"

describe("importInputFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importInputFieldFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importInputFieldFromEnterprise(
      mockСontext,
      fullInputFieldEnterprise,
      fullInputField.name,
      fullInputField.id
    )

    expect(result).toEqual(fullInputField)
  })
})
