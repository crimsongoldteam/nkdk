import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToStructure"
import { tableExportToStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { mockСontext } from "~/tests/mockContext"
import { exportTableToStructure } from "./exportToStructure"

describe("exportTableToStructure", () => {
  it.each(tableExportToStructureFixtures)("$name", ({ table, expectedResult }) => {
    const result = exportTableToStructure(mockСontext, table)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
