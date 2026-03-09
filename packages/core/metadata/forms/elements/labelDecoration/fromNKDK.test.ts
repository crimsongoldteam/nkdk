import { describe, expect, it } from "vitest"
import { labelDecorationStructureFixturesTable } from "~/tests/fixtures/forms/labelDecoration/data"
import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importLabelDecorationFromStructure", () => {
  it.each(labelDecorationStructureFixturesTable)(
    "should import label decoration $name",
    async ({ element: input, structured }) => {
      const result = await testimportElementFromNKDK(mockContext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})
