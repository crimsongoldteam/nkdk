import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullTrackBarField, fullTrackBarFieldEnterprise } from "~/tests/fixtures/forms/trackBarField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export TrackBarField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullTrackBarField,
    })
    expect(result).toEqual(fullTrackBarFieldEnterprise)
  })
})
