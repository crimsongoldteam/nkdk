import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToStructure"
import { tableStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { mockСontext } from "~/tests/mockContext"
import { exportTableToStructure } from "./exportToStructure"

describe("exportTableToStructure", () => {
  it.each(tableStructureFixtures)("$name", ({ table, structure: expectedResult }) => {
    const result = exportTableToStructure(mockСontext, table)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
