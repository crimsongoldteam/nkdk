import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullRadioButtonField, fullRadioButtonFieldEnterprise } from "~/metadata/forms/elements/radioButtonField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export RadioButtonField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullRadioButtonField,
    })
    expect(result).toEqual(fullRadioButtonFieldEnterprise)
  })
})
