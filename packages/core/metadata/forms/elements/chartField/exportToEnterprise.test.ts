import { describe, expect, it } from "vitest"
import { fullChartField, fullChartFieldEnterprise, minimalChartField, minimalChartFieldEnterprise } from "~/tests/fixtures/forms/chartField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportChartFieldToEnterprise } from "./exportToEnterprise"

describe("exportChartFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportChartFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportChartFieldToEnterprise(mockСontext, fullChartField)

    expect(result).toEqual(fullChartFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportChartFieldToEnterprise(mockСontext, minimalChartField)

    expect(result).toEqual(minimalChartFieldEnterprise)
  })
})

