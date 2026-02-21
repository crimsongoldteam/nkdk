import { describe, expect, it } from "vitest"
import { colorEnterpriseTestCases } from "~/tests/fixtures/color/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportColorToEnterprise } from "./toEnterprise"

describe("exportColorToEnterprise", () => {
  it.each(colorEnterpriseTestCases)("should handle $name", ({ color, expected }) => {
    const result = exportColorToEnterprise(mockContext, mockRule, color)

    expect(result).toEqual(expected)
  })
})
