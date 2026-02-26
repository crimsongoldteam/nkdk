import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullChartField,
  fullChartFieldEnterprise,
} from "~/tests/fixtures/forms/chartField/data"
import { mockContext } from "~/tests/mockContext"

describe("export ChartField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.ChartField,
      value: fullChartField,
    })
    expect(result).toEqual(fullChartFieldEnterprise)
  })
})
