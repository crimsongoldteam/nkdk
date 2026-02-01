import { describe, expect, it } from "vitest"
import { fullLabelField, fullLabelFieldPreview } from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"
import { exportLabelFieldToPreview } from "./exportToPreview"

describe("exportLabelFieldToPreview", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: {
        prefix: "prefix_",
        attributes: {},
      },
    }

    const result = exportLabelFieldToPreview(context, fullLabelField)

    expect(result).toEqual(fullLabelFieldPreview)
  })
})
