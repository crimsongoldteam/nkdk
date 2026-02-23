import { describe, expect, it } from "vitest"
import { buttonStructureFixturesTable } from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { exportButtonToNKDK } from "./toNKDK"

describe("exportButtonToStructure", () => {
  it.each(buttonStructureFixturesTable)("should export button $name", ({ element: input, structured: expected }) => {
    const result = exportButtonToNKDK({ context: mockContext, element: input })

    expect(result).toEqual(expected)
  })
})
