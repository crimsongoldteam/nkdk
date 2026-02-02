import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportDynamicListToYAML } from "./exportToYAML"

describe("exportDynamicListToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportDynamicListToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return data as is", () => {
    const data = { filter: "test" }
    const result = exportDynamicListToYAML(mockContext, mockRule, data)
    expect(result).toEqual(data)
  })
})
