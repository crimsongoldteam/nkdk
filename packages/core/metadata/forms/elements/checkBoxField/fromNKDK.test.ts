import { describe, expect, it } from "vitest"
import { checkBoxFieldStructureFixturesTable } from "~/tests/fixtures/forms/checkBoxField/data"
import { testImportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importCheckBoxFieldFromStructure", () => {
  it.each(checkBoxFieldStructureFixturesTable)(
    "should import check box field $name",
    async ({ element: input, structured }) => {
      const result = await testImportElementFromNKDK(mockContext, structured)

      expect(result).toEqual(input)
    }
  )
})
