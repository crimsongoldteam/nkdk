import { describe, expect, it } from "vitest"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullTable, fullTableEnterprise } from "~/metadata/forms/elements/table/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export Table to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullTable,
    })
    expect(result).toEqual(fullTableEnterprise)
  })
})
