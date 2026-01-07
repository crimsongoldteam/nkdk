import { describe, expect, it } from "vitest"
import { labelDecorationStructureFixturesTable } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { exportLabelDecorationToStructure } from "./exportToStructure"

describe("exportLabelDecorationToStructure", () => {
  it.each(labelDecorationStructureFixturesTable)(
    "should export label decoration $name",
    ({ element: input, structured: expected }) => {
      const result = exportLabelDecorationToStructure(mockСontext, input)

      expect(result.strings).toEqual(expected.strings)
    }
  )
})

