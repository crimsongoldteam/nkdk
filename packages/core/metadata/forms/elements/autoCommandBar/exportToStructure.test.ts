import { describe, expect, it } from "vitest"
import { autoCommandBarStructureFixturesTable } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"
import { exportAutoCommandBarToStructure } from "./exportToStructure"

describe("exportAutoCommandBarToStructure", () => {
  it.each(autoCommandBarStructureFixturesTable)(
    "should export auto command bar $name to structure",
    ({ element: input, structured: expected }) => {
      const result = exportAutoCommandBarToStructure(mockContext, input)

      expect(result).toEqual(expected)
    }
  )
})
