import { describe, expect, it } from "vitest"
import { colorEnterpriseTestCases } from "~/metadata/commonObjects/color/__fixtures__/data"
import { exportColorToEnterprise } from "./toEnterprise"

describe("exportColorToEnterprise", () => {
  it.each(colorEnterpriseTestCases)("should handle $name", ({ color, expected }) => {
    const result = exportColorToEnterprise({ value: color })

    expect(result).toEqual(expected)
  })

  it("should reject raw XML color ref", () => {
    expect(() =>
      exportColorToEnterprise({ value: { rawRef: "0:615512b6-4378-4fce-86f1-a56725f945da" } })
    ).toThrow("Color Enterprise: rawRef is XML-only")
  })
})
