import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullLabelDecoration, fullLabelDecorationEnterprise } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export LabelDecoration to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: "LabelDecoration",
      value: fullLabelDecoration,
    })
    expect(result).toEqual(fullLabelDecorationEnterprise)
  })
})
