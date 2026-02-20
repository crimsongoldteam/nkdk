import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportBooleanToYAML } from "./toYAML"

describe("exportBooleanToYAML", () => {
  it("should return undefined when value is undefined", () => {
    const result = exportBooleanToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    const result = exportBooleanToYAML(mockContext, mockRule, true)

    expect(result).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    const result = exportBooleanToYAML(mockContext, mockRule, false)

    expect(result).toBe("Ложь")
  })
})
