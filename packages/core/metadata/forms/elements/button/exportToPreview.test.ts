import { describe, expect, it } from "vitest"
import { fullButton } from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { exportButtonToPreview } from "./exportToPreview"

describe("exportButtonToPreview", () => {
  it("should export all fields to Preview", () => {
    const context = {
      ...mockContext,
      preview: {
        prefix: "prefix_",
        attributes: {},
      },
    }

    const result = exportButtonToPreview(context, fullButton)

    expect(result).toEqual(fullButtonPreview)
  })
})
