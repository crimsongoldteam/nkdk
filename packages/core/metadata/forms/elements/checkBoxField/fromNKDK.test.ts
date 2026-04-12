import { describe, expect, it } from "vitest"
import { checkBoxFieldStructureFixturesTable } from "~/metadata/forms/elements/checkBoxField/__fixtures__/data"
import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importCheckBoxFieldFromStructure", () => {
  it.each(checkBoxFieldStructureFixturesTable)(
    "should import check box field $description",
    async ({ element: input, nkdk: structured }) => {
      const result = await testimportElementFromNKDK(mockContext, structured.strings)

      expect(result).toEqual(input)
    }
  )
})
