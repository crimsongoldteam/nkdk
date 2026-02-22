import { describe, expect, it } from "vitest"
import { colorEnterpriseTestCases } from "~/tests/fixtures/color/data"
import { exportColorToEnterprise } from "./toEnterprise"

describe("exportColorToEnterprise", () => {
  it.each(colorEnterpriseTestCases)("should handle $name", ({ color, expected }) => {
    const result = exportColorToEnterprise({ value: color })

    expect(result).toEqual(expected)
  })
})
