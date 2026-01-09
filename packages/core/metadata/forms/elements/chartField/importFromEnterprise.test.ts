import { describe, expect, it } from "vitest"
import { fullChartField, fullChartFieldEnterprise, minimalChartField, minimalChartFieldEnterprise } from "~/tests/fixtures/forms/chartField/data"
import { mockСontext } from "~/tests/mockContext"
import { importChartFieldFromEnterprise } from "./importFromEnterprise"

describe("importChartFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importChartFieldFromEnterprise(mockСontext, undefined, fullChartField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importChartFieldFromEnterprise(mockСontext, fullChartFieldEnterprise, fullChartField.name)

    expect(result).toEqual(fullChartField)
  })

  it("should import minimal", () => {
    const result = importChartFieldFromEnterprise(mockСontext, minimalChartFieldEnterprise, minimalChartField.name)

    expect(result).toEqual(minimalChartField)
  })
})

