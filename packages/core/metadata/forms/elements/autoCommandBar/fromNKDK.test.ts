import { describe, expect, it } from "vitest"
import { autoCommandBarStructureFixturesTable } from "~/metadata/forms/elements/autoCommandBar/__fixtures__/data"
import { testimportFormAutoCommandBarFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importAutoCommandBarFromStructure", () => {
  it.each(autoCommandBarStructureFixturesTable)(
    "should import auto command bar $name from structure",
    async ({ element: input, structured }) => {
      const result = await testimportFormAutoCommandBarFromNKDK(mockContext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})
