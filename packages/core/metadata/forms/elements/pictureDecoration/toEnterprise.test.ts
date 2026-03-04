import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullPictureDecoration, fullPictureDecorationEnterprise } from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("export PictureDecoration to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.PictureDecoration,
      value: fullPictureDecoration,
    })
    expect(result).toEqual(fullPictureDecorationEnterprise)
  })
})
