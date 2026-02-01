import { describe, expect, it } from "vitest"
import { pictureTestCases } from "~/tests/fixtures/picture/data"
import { mockСontext } from "../../../tests/mockContext"
import { exportPictureToPreview } from "./exportToPreview"

describe("exportPictureToPreview", () => {
  it.each(pictureTestCases)("should import $name from Enterprise", ({ picture, preview }) => {
    const result = exportPictureToPreview(mockСontext, picture)

    expect(result).toEqual(preview)
  })
})
