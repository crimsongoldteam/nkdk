import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  fullInputField,
  fullInputFieldEnterprise,
  fullTableInputField,
  fullTableInputFieldEnterprise,
} from "~/metadata/forms/elements/inputField/__fixtures__/data"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { mockContextToEnterprise } from "~/tests/mockContext"

const createContextToEnterprise = (): ConfigurationContext => ({
  ...mockContextToEnterprise,
  enterprise: {
    ...mockContextToEnterprise.enterprise!,
    attributes: {},
    elementsTree: [],
    allElementsNames: [],
  },
})

describe("export InputField to Enterprise", () => {
  describe("InputField", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fullInputField,
      })
      expect(result).toEqual(fullInputFieldEnterprise)
    })

    it("should add prefix from context to element Name when prefix is set", () => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fullInputField,
      })
      expect(result.Name).toBe("prefix_ПолеВвода")
    })

    it("should add counter to Name when name already exists in context.allElementsNames", () => {
      const contextWithExistingName: ConfigurationContext = {
        ...createContextToEnterprise(),
        enterprise: {
          ...createContextToEnterprise().enterprise!,
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

  describe("TableInputField", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fullTableInputField,
      })

      expect(result).toEqual(fullTableInputFieldEnterprise)
    })
  })
})
