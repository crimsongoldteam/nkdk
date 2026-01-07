import { describe, expect, it } from "vitest"
import { fullFormField, fullFormFieldEnterprise, minimalFormField, minimalFormFieldEnterprise } from "~/tests/fixtures/forms/formField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFormFieldToEnterprise } from "./exportToEnterprise"

describe("exportFormFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportFormFieldToEnterprise(mockСontext, fullFormField)

    expect(result).toEqual(fullFormFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportFormFieldToEnterprise(mockСontext, minimalFormField)

    expect(result).toEqual(minimalFormFieldEnterprise)
  })
})

