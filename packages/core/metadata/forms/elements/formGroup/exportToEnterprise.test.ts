import { describe, expect, it } from "vitest"
import { fullFormGroup, fullFormGroupEnterprise, minimalFormGroup, minimalFormGroupEnterprise } from "~/tests/fixtures/forms/formGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFormGroupToEnterprise } from "./exportToEnterprise"

describe("exportFormGroupToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormGroupToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportFormGroupToEnterprise(mockСontext, fullFormGroup)

    expect(result).toEqual(fullFormGroupEnterprise)
  })

  it("should export minimal", () => {
    const result = exportFormGroupToEnterprise(mockСontext, minimalFormGroup)

    expect(result).toEqual(minimalFormGroupEnterprise)
  })
})

