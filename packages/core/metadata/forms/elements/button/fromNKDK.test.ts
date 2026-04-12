import { describe, expect, it } from "vitest"
import { buttonStructureFixturesTable } from "~/metadata/forms/elements/button/__fixtures__/data"
import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importButtonFromStructure", () => {
  it.each(buttonStructureFixturesTable)("should import button $name", async ({ element: input, structured }) => {
    const result = await testimportElementFromNKDK(mockContext, structured.strings)

    expect(result).toEqual(input)
  })
})
