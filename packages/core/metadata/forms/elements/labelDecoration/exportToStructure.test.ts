import { describe, expect, it } from "vitest"
import { labelDecorationStructureFixturesTable } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportLabelDecorationToStructure } from "./exportToStructure"

describe("exportLabelDecorationToStructure", () => {
  it.each(labelDecorationStructureFixturesTable)(
    "should export label decoration $name",
    ({ element: input, structured: expected }) => {
      const result = exportLabelDecorationToStructure(mockContext, mockRule, input)

      expect(result).toEqual(expected)
    }
  )
})
