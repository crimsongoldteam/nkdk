import { describe, expect, it } from "vitest"
import {
  buttonStructureFixturesTable,
  commandBarButtonStructureFixturesTable,
} from "~/metadata/forms/elements/button/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { exportButtonToNKDK, exportCommandBarButtonToNKDK } from "./toNKDK"

describe("exportButtonToStructure", () => {
  it.each(buttonStructureFixturesTable)("should export button $name", ({ element: input, structured: expected }) => {
    const result = exportButtonToNKDK({ context: mockContext, element: input })

    expect(result).toEqual(expected)
  })
})

describe("exportCommandBarButtonToStructure", () => {
  it.each(commandBarButtonStructureFixturesTable)(
    "should export command bar button $name",
    ({ element: input, structured: expected }) => {
      const result = exportCommandBarButtonToNKDK({ context: mockContext, element: input })

      expect(result).toEqual(expected)
    }
  )
})
