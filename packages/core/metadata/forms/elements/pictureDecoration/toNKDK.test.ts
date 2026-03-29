import { describe, expect, it } from "vitest"
import { pictureDecorationStructureFixturesTable } from "~/metadata/forms/elements/pictureDecoration/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { exportPictureDecorationToNKDK } from "./toNKDK"

describe("exportPictureDecorationToNKDK", () => {
  it.each(pictureDecorationStructureFixturesTable)(
    "should export input field $name",
    ({ element: input, structured: expected }) => {
      const result = exportPictureDecorationToNKDK({ context: mockContext, element: input })
      expect(result).toEqual(expected)
    }
  )
})
