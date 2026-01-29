import { describe, expect, it } from "vitest"
import { pictureDecorationStructureFixturesTable } from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { exportPictureDecorationToStructure } from "./exportToStructure"

describe("exportPictureDecorationToStructure", () => {
  it.each(pictureDecorationStructureFixturesTable)(
    "should export input field $name",
    ({ element: input, structured: expected }) => {
      const result = exportPictureDecorationToStructure(mockСontext, input)
      expect(result.strings).toEqual(expected.strings)
    }
  )
})
