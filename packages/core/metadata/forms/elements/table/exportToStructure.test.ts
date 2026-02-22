import { describe, expect, it } from "vitest"
import { tableStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportTableToStructure } from "./exportToStructure"

describe("exportTableToStructure", () => {
  it.each(tableStructureFixtures)("$name", ({ table, structure: expectedResult }) => {
    const result = exportTableToStructure(mockContextToYAML, table)

    expect(result.join("\n")).toEqual(expectedResult)
  })
})
