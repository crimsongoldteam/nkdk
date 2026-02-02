import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportFieldsListToYAML } from "./exportToYAML"

describe("exportFieldsListToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFieldsListToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportFieldsListToYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should export fields list", () => {
    const data = ["Field1", "Field2"]
    const result = exportFieldsListToYAML(mockContext, mockRule, data)
    expect(result).toEqual(data)
  })
})
