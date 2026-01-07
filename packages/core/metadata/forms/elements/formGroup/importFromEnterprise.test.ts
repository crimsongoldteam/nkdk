import { describe, expect, it } from "vitest"
import { fullFormGroup, fullFormGroupEnterprise, minimalFormGroup, minimalFormGroupEnterprise } from "~/tests/fixtures/forms/formGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { importFormGroupFromEnterprise } from "./importFromEnterprise"

describe("importFormGroupFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormGroupFromEnterprise(mockСontext, undefined, fullFormGroup.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importFormGroupFromEnterprise(mockСontext, fullFormGroupEnterprise, fullFormGroup.name)
    result!.id = "1"

    expect(result).toEqual(fullFormGroup)
  })

  it("should import minimal", () => {
    const result = importFormGroupFromEnterprise(mockСontext, minimalFormGroupEnterprise, minimalFormGroup.name)
    result!.id = "1"

    expect(result).toEqual(minimalFormGroup)
  })
})

