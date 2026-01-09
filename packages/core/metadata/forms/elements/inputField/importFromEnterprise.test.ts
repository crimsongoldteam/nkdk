import { describe, expect, it } from "vitest"
import {
  fullInputField,
  fullInputFieldEnterprise,
  minimalInputField,
  minimalInputFieldEnterprise,
} from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import { importInputFieldFromEnterprise } from "./importFromEnterprise"

describe("importInputFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importInputFieldFromEnterprise(mockСontext, undefined, fullInputField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importInputFieldFromEnterprise(mockСontext, fullInputFieldEnterprise, fullInputField.name)

    expect(result).toEqual(fullInputField)
  })

  it("should import minimal", () => {
    const result = importInputFieldFromEnterprise(mockСontext, minimalInputFieldEnterprise, minimalInputField.name)

    expect(result).toEqual(minimalInputField)
  })
})
