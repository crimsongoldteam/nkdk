import { describe, expect, it } from "vitest"
import { buttonStructureFixturesTable } from "~/tests/fixtures/forms/button/data"
import { testImportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importButtonFromStructure", () => {
  it.each(buttonStructureFixturesTable)("should import button $name", async ({ element: input, structured }) => {
    const result = await testImportElementFromNKDK(mockContext, structured)

    expect(result).toEqual(input)
  })
})
