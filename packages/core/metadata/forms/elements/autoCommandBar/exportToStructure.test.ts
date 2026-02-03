import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToStructure"
import { autoCommandBarStructureFixturesTable } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportAutoCommandBarToStructure } from "./exportToStructure"

describe("exportAutoCommandBarToStructure", () => {
  it.each(autoCommandBarStructureFixturesTable)(
    "should export auto command bar $name to structure",
    ({ element: input, structured: expected }) => {
      const result = exportAutoCommandBarToStructure(mockContext, mockRule, input)

      expect(result.strings).toEqual(expected.strings)
    }
  )
})
