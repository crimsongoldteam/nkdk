import { describe, expect, it } from "vitest"
import { tableStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { testImportTableFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importTableFromStructure", () => {
  it.each(tableStructureFixtures)("should import table $name", async ({ table: expected, structure }) => {
    const result = await testImportTableFromNKDK(mockContext, structure)

    expect(result).toEqual(expected)
  })
})
