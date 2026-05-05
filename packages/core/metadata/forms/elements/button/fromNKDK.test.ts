import { describe, expect, it } from "vitest"
import {
  buttonStructureFixturesTable,
  commandBarButtonStructureFixturesTable,
} from "~/metadata/forms/elements/button/__fixtures__/data"
import { importFormFromNKDK, testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importButtonFromStructure", () => {
  it.each(buttonStructureFixturesTable)("should import button $name", async ({ element: input, structured }) => {
    const result = await testimportElementFromNKDK(mockContext, structured.strings)

    expect(result).toEqual(input)
  })
})

describe("importCommandBarButtonFromStructure", () => {
  it.each(commandBarButtonStructureFixturesTable)(
    "should import command bar button $name",
    async ({ element: input, structured }) => {
      const commandBarString = `<${structured.strings[0]}> Панель`
      const form = await importFormFromNKDK(mockContext, commandBarString)
      const commandBar = form?.childItems[0] as { childItems?: unknown[] }
      const result = commandBar?.childItems?.[0]

      expect(result).toEqual(input)
    }
  )
})
