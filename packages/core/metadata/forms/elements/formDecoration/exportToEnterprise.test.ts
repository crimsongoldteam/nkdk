import { describe, expect, it } from "vitest"
import { fullFormDecoration, fullFormDecorationEnterprise, minimalFormDecoration, minimalFormDecorationEnterprise } from "~/tests/fixtures/forms/formDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFormDecorationToEnterprise } from "./exportToEnterprise"

describe("exportFormDecorationToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormDecorationToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportFormDecorationToEnterprise(mockСontext, fullFormDecoration)

    expect(result).toEqual(fullFormDecorationEnterprise)
  })

  it("should export minimal", () => {
    const result = exportFormDecorationToEnterprise(mockСontext, minimalFormDecoration)

    expect(result).toEqual(minimalFormDecorationEnterprise)
  })
})

