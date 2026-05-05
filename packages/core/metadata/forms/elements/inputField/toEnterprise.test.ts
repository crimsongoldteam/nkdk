import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
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

  it("should add prefix from context to element Name when prefix is set", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullInputField,
    })
    expect(result.Name).toBe("prefix_ПолеВвода")
  })

  it("should add counter to Name when name already exists in context.allElementsNames", () => {
    const contextWithExistingName: ConfigurationContext = {
      ...mockContextToEnterprise,
      enterprise: {
        ...mockContextToEnterprise.enterprise!,
        allElementsNames: ["prefix_ПолеВвода"],
      },
    }
    const result = exportElementToEnterprise({
      context: contextWithExistingName,
      value: fullInputField,
    })
    expect(result.Name).toBe("prefix_ПолеВвода1")
  })
})
