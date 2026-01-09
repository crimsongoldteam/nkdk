import { describe, expect, it } from "vitest"
import {
  fullFormField,
  fullFormFieldEnterprise,
  minimalFormField,
  minimalFormFieldEnterprise,
} from "~/tests/fixtures/forms/formField/data"
import { mockСontext } from "~/tests/mockContext"
import { importFormFieldFromEnterprise } from "./importFromEnterprise"

describe("importFormFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormFieldFromEnterprise(mockСontext, undefined, fullFormField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importFormFieldFromEnterprise(mockСontext, fullFormFieldEnterprise, fullFormField.name)

    expect(result).toEqual(fullFormField)
  })

  it("should import minimal", () => {
    const result = importFormFieldFromEnterprise(mockСontext, minimalFormFieldEnterprise, minimalFormField.name)

    expect(result).toEqual(minimalFormField)
  })
})
