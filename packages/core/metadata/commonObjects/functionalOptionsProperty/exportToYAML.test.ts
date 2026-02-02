import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportFunctionalOptionsToYAML } from "./exportToYAML"

describe("exportFunctionalOptionsToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFunctionalOptionsToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportFunctionalOptionsToYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should export functional options", () => {
    const data = ["Option1", "Option2"]
    const result = exportFunctionalOptionsToYAML(mockContext, mockRule, data)
    expect(result).toEqual(data)
  })
})
