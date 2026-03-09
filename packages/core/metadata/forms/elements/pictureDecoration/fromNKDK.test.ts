import { describe, expect, it } from "vitest"
import { pictureDecorationStructureFixturesTable } from "~/tests/fixtures/forms/pictureDecoration/data"
import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importPictureDecorationFromStructure", () => {
  it.each(pictureDecorationStructureFixturesTable.filter((tc) => !tc.skipImport))(
    "should import picture decoration $name",
    async ({ element: input, structured }) => {
      const result = await testimportElementFromNKDK(mockContext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})
