import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToStructure"
import { commandBarStructureFixturesTable } from "~/tests/fixtures/forms/commandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCommandBarToStructure } from "./exportToStructure"

describe("exportCommandBarToStructure", () => {
  it.each(commandBarStructureFixturesTable)(
    "should export command bar $name",
    ({ element: input, structured: expected }) => {
      const result = exportCommandBarToStructure(mockContext, mockRule, input)

      expect(result.strings).toEqual(expected.strings)
    }
  )
})
