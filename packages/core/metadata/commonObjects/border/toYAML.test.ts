import { describe, expect, it } from "vitest"
import { borderTestCases } from "~/metadata/commonObjects/border/__fixtures__/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportBorderToYAML } from "./toYAML"
import { Border, BorderYAML } from "./types"

describe("exportBorderToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportBorderToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export border by style ref without empty width", () => {
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.yaml).toBeDefined()

    const result = exportBorderToYAML(mockContext, mockRule, fixture!.border)

    expect(result).toEqual(fixture!.yaml)
    expect(result).not.toHaveProperty("Ширина")
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
