import { describe, expect, it } from "vitest"
import { tableStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { testImportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importTableFromStructure", () => {
  it.each(tableStructureFixtures)("should import table $name", async ({ table: expected, nkdk: structure }) => {
    const result = await testImportElementFromNKDK(mockContext, structure.strings)

    expect(result).toEqual(expected)
  })
})
