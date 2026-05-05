import { describe, expect, it } from "vitest"
import { tableStructureFixtures } from "~/metadata/forms/elements/table/__fixtures__/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportTableToNKDK } from "./toNKDK"

describe("exportTableToStructure", () => {
  it.each(tableStructureFixtures)("$name", ({ table, nkdk, nkdkExport }) => {
    const nkdkResult = nkdkExport ?? nkdk
    const result = exportTableToNKDK({ context: mockContextToYAML, element: table })

    expect(result).toEqual(nkdkResult)
  })
})
