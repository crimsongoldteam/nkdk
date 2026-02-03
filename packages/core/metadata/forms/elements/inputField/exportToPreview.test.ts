import { describe, expect, it } from "vitest"
import { fullInputField, fullInputFieldPreview } from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"
import { exportInputFieldToPreview } from "./exportToPreview"

describe("exportInputFieldToPreview", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: {
        prefix: "prefix_",
        attributes: {},
      },
    }

    const result = exportInputFieldToPreview(context, undefined, fullInputField)

    expect(result).toEqual(fullInputFieldPreview)
  })
})
