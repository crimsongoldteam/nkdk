import { describe, expect, it } from "vitest"
import { autoCommandBarStructureFixturesTable } from "~/metadata/forms/elements/autoCommandBar/__fixtures__/data"
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
