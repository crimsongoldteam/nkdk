import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPictureDecoration, fullPictureDecorationEnterprise } from "~/metadata/forms/elements/pictureDecoration/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export PictureDecoration to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullPictureDecoration,
    })
    expect(result).toEqual(fullPictureDecorationEnterprise)
  })
})
