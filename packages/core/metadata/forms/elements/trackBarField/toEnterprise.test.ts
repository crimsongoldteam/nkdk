import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullTrackBarField, fullTrackBarFieldEnterprise } from "~/metadata/forms/elements/trackBarField/__fixtures__/data"
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
