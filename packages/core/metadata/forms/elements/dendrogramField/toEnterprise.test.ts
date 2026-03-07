import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullDendrogramField, fullDendrogramFieldEnterprise } from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export DendrogramField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullDendrogramField,
    })
    expect(result).toEqual(fullDendrogramFieldEnterprise)
  })
})
