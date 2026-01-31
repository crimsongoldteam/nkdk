import { describe, expect, it } from "vitest"
import { fullInputField, fullInputFieldPreview } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportInputFieldToPreview } from "./exportToPreview"

describe("exportInputFieldToPreview", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockСontext,
      preview: {
        prefix: "prefix_",
        attributes: {},
      },
    }

    const result = exportInputFieldToPreview(context, fullInputField)

    expect(result).toEqual(fullInputFieldPreview)
  })
})
