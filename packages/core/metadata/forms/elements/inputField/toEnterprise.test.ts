import { describe, expect, it } from "vitest"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullInputField, fullInputFieldEnterprise } from "~/tests/fixtures/forms/inputField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export InputField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullInputField,
    })
    expect(result).toEqual(fullInputFieldEnterprise)
  })
})
