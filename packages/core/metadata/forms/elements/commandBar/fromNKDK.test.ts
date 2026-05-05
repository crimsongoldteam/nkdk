import { describe, expect, it } from "vitest"
import { commandBarStructureFixturesTable } from "~/metadata/forms/elements/commandBar/__fixtures__/data"
import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importCommandBarFromStructure", () => {
  it.each(commandBarStructureFixturesTable)(
    "should import command bar $name",
    async ({ element: input, structured }) => {
      const result = await testimportElementFromNKDK(mockContext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})
