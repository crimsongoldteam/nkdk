import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullCheckBoxField, fullCheckBoxFieldEnterprise } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export CheckBoxField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullCheckBoxField,
    })
    expect(result).toEqual(fullCheckBoxFieldEnterprise)
  })
})
