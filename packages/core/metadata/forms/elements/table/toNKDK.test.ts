import { describe, expect, it } from "vitest"
import { tableStructureFixtures } from "~/tests/fixtures/forms/table/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportTableToNKDK } from "./toNKDK"

describe("exportTableToStructure", () => {
  it.each(tableStructureFixtures)("$name", ({ table, structure: expectedResult }) => {
    const result = exportTableToNKDK({ context: mockContextToYAML, element: table })

    expect(result).toEqual(expectedResult)
  })
})
