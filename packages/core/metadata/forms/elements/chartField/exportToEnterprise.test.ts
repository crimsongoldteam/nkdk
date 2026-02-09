import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullChartField,
  fullChartFieldPartialEnterprise,
  minimalChartField,
} from "~/tests/fixtures/forms/chartField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportChartFieldToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullChartField })

    expect(result).toEqual(fullChartFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalChartField })

    expect(result).toBeUndefined()
  })
})
