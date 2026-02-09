import { describe, expect, it } from "vitest"
import { tableStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"
import { exportTableToStructure } from "./exportToStructure"

describe("exportTableToStructure", () => {
  it.each(tableStructureFixtures)("$name", ({ table, structure: expectedResult }) => {
    const result = exportTableToStructure(mockContext, table)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
