import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPage, fullPageEnterprise } from "~/tests/fixtures/forms/page/data"
import { mockContext } from "~/tests/mockContext"

describe("export Page to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: {
        prefix: "prefix_",
        attributes: {},
      },
    }
    const result = exportElementToEnterprise({
      context,
      value: fullPage,
    })
    expect(result).toEqual(fullPageEnterprise)
  })
})
