import { describe, expect, it } from "vitest"
import { autoCommandBarStructureFixturesTable } from "~/tests/fixtures/forms/autoCommandBar/data"
import { testImportFormAutoCommandBarFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importAutoCommandBarFromStructure", () => {
  it.each(autoCommandBarStructureFixturesTable)(
    "should import auto command bar $name from structure",
    async ({ element: input, structured }) => {
      const result = await testImportFormAutoCommandBarFromNKDK(mockContext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})
