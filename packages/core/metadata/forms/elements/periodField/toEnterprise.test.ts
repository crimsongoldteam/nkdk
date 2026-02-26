import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullPeriodField,
  fullPeriodFieldEnterprise,
} from "~/tests/fixtures/forms/periodField/data"
import { mockContext } from "~/tests/mockContext"

describe("export PeriodField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.PeriodField,
      value: fullPeriodField,
    })
    expect(result).toEqual(fullPeriodFieldEnterprise)
  })
})
