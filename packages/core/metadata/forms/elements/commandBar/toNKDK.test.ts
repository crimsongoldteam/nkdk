import { describe, expect, it } from "vitest"
import { commandBarStructureFixturesTable } from "~/metadata/forms/elements/commandBar/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { exportCommandBarToNKDK } from "./toNKDK"

describe("exportCommandBarToStructure", () => {
  it.each(commandBarStructureFixturesTable)(
    "should export command bar $name",
    ({ element: input, structured: expected }) => {
      const result = exportCommandBarToNKDK({ context: mockContext, element: input })

      expect(result).toEqual(expected)
    }
  )
})
