import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPopup, fullPopupEnterprise } from "~/tests/fixtures/forms/popup/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export Popup to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullPopup,
    })
    expect(result).toEqual(fullPopupEnterprise)
  })
})
