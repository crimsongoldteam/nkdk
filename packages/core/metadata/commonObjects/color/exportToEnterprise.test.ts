import { describe, expect, it } from "vitest"
import { colorTestCases } from "~/tests/fixtures/color/data"
import { mockСontext } from "~/tests/mockContext"
import { exportColorToEnterprise } from "./exportToEnterprise"

describe("exportColorToEnterprise", () => {
  it("should return undefined for undefined input", () => {
    const result = exportColorToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it.each(colorTestCases)("should export $name to Enterprise", ({ color, enterpriseExpected }) => {
    const result = exportColorToEnterprise(mockСontext, color)

    expect(result).toEqual(enterpriseExpected)
  })
})
