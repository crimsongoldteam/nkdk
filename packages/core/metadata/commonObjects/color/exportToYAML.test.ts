import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportColorToYAML } from "./exportToYAML"

describe("exportColorToYAML", () => {
  it("should return undefined when color is undefined", () => {
    const result = exportColorToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export StyleItem color with standard color", () => {
    const color = {
      type: "StyleItem" as const,
      value: "ButtonNormal",
    }
    const result = exportColorToYAML(mockContext, mockRule, color)
    expect(result).toBe("ЦветКнопки")
  })

  it("should export StyleItem color with custom style", () => {
    const color = {
      type: "StyleItem" as const,
      value: "CustomColor",
    }
    const result = exportColorToYAML(mockContext, mockRule, color)
    expect(result).toBe("ЭлементСтиля.CustomColor")
  })

  it("should export WindowsColor", () => {
    const color = {
      type: "WindowsColor" as const,
      value: "red",
    }
    const result = exportColorToYAML(mockContext, mockRule, color)
    expect(result).toBe("Красный")
  })

  it("should export WebColor", () => {
    const color = {
      type: "WebColor" as const,
      value: "#FF0000",
    }
    const result = exportColorToYAML(mockContext, mockRule, color)
    expect(result).toBe("#FF0000")
  })
})
