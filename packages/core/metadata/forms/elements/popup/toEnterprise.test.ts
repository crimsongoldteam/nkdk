import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullPopup, fullPopupEnterprise } from "~/tests/fixtures/forms/popup/data"
import { mockContext } from "~/tests/mockContext"

describe("export Popup to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.Popup,
      value: fullPopup,
    })
    expect(result).toEqual(fullPopupEnterprise)
  })
})
