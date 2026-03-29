import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import { fullChartField, fullChartFieldPartialYAML, minimalChartField } from "~/metadata/forms/elements/chartField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportChartFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullChartField })

    expect(result).toEqual(fullChartFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalChartField })

    expect(result).toBeUndefined()
  })
})
