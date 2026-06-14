import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportBorderToYAML } from "./toYAML"
import { Border, BorderYAML } from "./types"

describe("exportBorderToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportBorderToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export border to enterprise format", () => {
    const borderData: Border = {
      ref: "Solid",
      width: 1,
      controlBorderType: "Double",
    }

    const expectedResult: BorderYAML = {
      Имя: "ЭлементСтиля.Solid",
      Ширина: 1,
      ТипРамки: "Двойная",
    }

    const result = exportBorderToYAML(mockContext, mockRule, borderData)
    expect(result).toEqual(expectedResult)
  })
})
