import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToStructure"
import { tableStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportTableToStructure } from "./exportToStructure"

describe("exportTableToStructure", () => {
  it.each(tableStructureFixtures)("$name", ({ table, structure: expectedResult }) => {
    const result = exportTableToStructure(mockContext, mockRule, table)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
