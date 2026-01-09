import { describe, expect, it } from "vitest"
import { fullFormDecoration, fullFormDecorationEnterprise, minimalFormDecoration, minimalFormDecorationEnterprise } from "~/tests/fixtures/forms/formDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { importFormDecorationFromEnterprise } from "./importFromEnterprise"

describe("importFormDecorationFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importFormDecorationFromEnterprise(mockСontext, undefined, fullFormDecoration.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importFormDecorationFromEnterprise(mockСontext, fullFormDecorationEnterprise, fullFormDecoration.name)

    expect(result).toEqual(fullFormDecoration)
  })

  it("should import minimal", () => {
    const result = importFormDecorationFromEnterprise(mockСontext, minimalFormDecorationEnterprise, minimalFormDecoration.name)

    expect(result).toEqual(minimalFormDecoration)
  })
})

