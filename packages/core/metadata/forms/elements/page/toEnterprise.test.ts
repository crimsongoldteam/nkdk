import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPage, fullPageEnterprise } from "~/tests/fixtures/forms/page/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export Page to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullPage,
    })
    expect(result).toEqual(fullPageEnterprise)
  })
})
