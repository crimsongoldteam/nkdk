import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportBorderToEnterprise } from "./exportToEnterprise"
import { Border, BorderEnterprise } from "./types"

describe("exportBorderToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportBorderToEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export border to enterprise format", () => {
    const borderData: Border = {
      ref: "Solid",
      width: 1,
      controlBorderType: "Double",
    }

    const expectedResult: BorderEnterprise = {
      Имя: "Solid",
      Ширина: 1,
      ТипРамки: "Двойная",
    }

    const result = exportBorderToEnterprise(mockContext, mockRule, borderData)
    expect(result).toEqual(expectedResult)
  })
})
