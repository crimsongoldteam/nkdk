import { describe, expect, it } from "vitest"
import { autoCommandBarStructureFixturesTable } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"
import { exportAutoCommandBarToNKDK } from "./toNKDK"

describe("exportAutoCommandBarToStructure", () => {
  it.each(autoCommandBarStructureFixturesTable)(
    "should export auto command bar $name to structure",
    ({ element: input, structured: expected }) => {
      const result = exportAutoCommandBarToNKDK({ context: mockContext, element: input })

      expect(result).toEqual(expected)
    }
  )
})
