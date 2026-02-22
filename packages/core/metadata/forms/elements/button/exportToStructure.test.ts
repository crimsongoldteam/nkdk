import { describe, expect, it } from "vitest"
import { buttonStructureFixturesTable } from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { exportButtonToStructure } from "./exportToStructure"

describe("exportButtonToStructure", () => {
  it.each(buttonStructureFixturesTable)("should export button $name", ({ element: input, structured: expected }) => {
    const result = exportButtonToStructure(mockContext, input)

    expect(result).toEqual(expected)
  })
})
