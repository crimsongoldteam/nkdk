import { describe, expect, it } from "vitest"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import {
  fullLabelField,
  fullLabelFieldEnterprise,
  fullTableLabelField,
  fullTableLabelFieldEnterprise,
} from "~/metadata/forms/elements/labelField/__fixtures__/data"
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

describe("export LabelField to Enterprise", () => {
  describe("LabelField", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fullLabelField,
      })

      expect(result).toEqual(fullLabelFieldEnterprise)
    })
  })

  describe("TableLabelField", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fullTableLabelField,
      })

      expect(result).toEqual(fullTableLabelFieldEnterprise)
    })
  })
})
