import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportBorderToYAML } from "./exportToYAML"

describe("exportBorderToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportBorderToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export border to enterprise format", () => {
    const borderData = {
      ref: "Solid",
      width: 1,
      controlBorderType: "Solid",
    }
    const result = exportBorderToYAML(mockContext, mockRule, borderData as any)
    expect(result).toEqual({
      Имя: "Solid",
      Ширина: 1,
      ТипРамки: "Сплошная",
    })
  })
})
