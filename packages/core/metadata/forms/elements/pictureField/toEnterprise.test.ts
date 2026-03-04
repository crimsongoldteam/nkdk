import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPictureField, fullPictureFieldEnterprise } from "~/tests/fixtures/forms/pictureField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export PictureField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: "PictureField",
      value: fullPictureField,
    })
    expect(result).toEqual(fullPictureFieldEnterprise)
  })
})
