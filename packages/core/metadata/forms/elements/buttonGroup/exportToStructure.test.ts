import { describe, expect, it } from "vitest"
import { buttonGroupStructureFixturesTable } from "~/tests/fixtures/forms/buttonGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { exportButtonGroupToStructure } from "./exportToStructure"

describe("exportButtonGroupToStructure", () => {
  it.each(buttonGroupStructureFixturesTable)(
    "should export button group $name",
    ({ element: input, structured: expected }) => {
      const result = exportButtonGroupToStructure(mockСontext, input)

      expect(result.strings).toEqual(expected.strings)
    }
  )
})
