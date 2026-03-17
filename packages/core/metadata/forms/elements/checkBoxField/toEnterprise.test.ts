import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import {
  fullCheckBoxField,
  fullCheckBoxFieldEnterprise,
  fullTableCheckBoxField,
  fullTableCheckBoxFieldEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

const createContextToEnterprise = () => ({
  ...mockContextToEnterprise,
  enterprise: {
    ...mockContextToEnterprise.enterprise!,
    attributes: {},
    elementsTree: [],
    allElementsNames: [],
  },
})

describe("export CheckBoxField to Enterprise", () => {
  describe("CheckBoxField", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fullCheckBoxField,
      })

      expect(result).toEqual(fullCheckBoxFieldEnterprise)
    })
  })

  describe("TableCheckBoxField", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fullTableCheckBoxField,
      })

      expect(result).toEqual(fullTableCheckBoxFieldEnterprise)
    })
  })
})
