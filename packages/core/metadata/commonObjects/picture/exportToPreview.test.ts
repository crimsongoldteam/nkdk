import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportPictureToPreview } from "./exportToPreview"

describe("exportPictureToPreview", () => {
  it.each(pictureTestCases)("should import $name from Enterprise", ({ picture, preview }) => {
    const result = exportPictureToPreview(mockContext, mockRule, picture)

    expect(result).toEqual(preview)
  })
})
