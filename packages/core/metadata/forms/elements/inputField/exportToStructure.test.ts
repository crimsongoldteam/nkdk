import { describe, expect, it } from "vitest"
import { inputFieldStructureFixturesTable } from "~/tests/fixtures/forms/inputField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportInputFieldToStructure } from "./exportToStructure"

describe("exportInputFieldToStructure", () => {
  it.each(inputFieldStructureFixturesTable)(
    "should export input field $name",
    ({ element: input, structured: expected }) => {
      const result = exportInputFieldToStructure(mockContext, mockRule, input)

      expect(result.strings).toEqual(expected.strings)
    }
  )
})
