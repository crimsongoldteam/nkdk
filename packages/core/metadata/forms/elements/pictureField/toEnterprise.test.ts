import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import {
  fullPictureField,
  fullPictureFieldEnterprise,
  fullTablePictureField,
  fullTablePictureFieldEnterprise,
} from "~/metadata/forms/elements/pictureField/__fixtures__/data"
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

describe("export PictureField to Enterprise", () => {
  describe("PictureField", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fullPictureField,
      })

      expect(result).toEqual(fullPictureFieldEnterprise)
    })
  })

  describe("TablePictureField", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fullTablePictureField,
      })

      expect(result).toEqual(fullTablePictureFieldEnterprise)
    })
  })
})
