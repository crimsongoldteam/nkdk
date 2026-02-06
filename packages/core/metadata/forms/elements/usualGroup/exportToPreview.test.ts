import { describe, expect, it } from "vitest"
import { fullUsualGroup, fullUsualGroupPreview } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { exportUsualGroupToPreview } from "./exportToPreview"

describe("exportUsualGroupToPreview", () => {
  it("should export all fields to Preview", () => {
    const context = {
      ...mockContext,
      preview: {
        prefix: "prefix_",
        attributes: {},
      },
    }

    const result = exportUsualGroupToPreview(context, fullUsualGroup)

    expect(result).toEqual(fullUsualGroupPreview)
  })
})
