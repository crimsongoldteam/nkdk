import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullProgressBarField, fullProgressBarFieldEnterprise } from "~/metadata/forms/elements/progressBarField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export ProgressBarField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullProgressBarField,
    })
    expect(result).toEqual(fullProgressBarFieldEnterprise)
  })
})
