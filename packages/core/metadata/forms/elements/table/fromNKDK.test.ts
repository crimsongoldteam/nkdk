import { describe, expect, it } from "vitest"
import { tableStructureFixtures } from "~/metadata/forms/elements/table/__fixtures__/data"
import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importTableFromStructure", () => {
  it.each(tableStructureFixtures)("should import table $name", async ({ table: expected, nkdk: structure }) => {
    const result = await testimportElementFromNKDK(mockContext, structure.strings)

    expect(result).toEqual(expected)
  })
})
