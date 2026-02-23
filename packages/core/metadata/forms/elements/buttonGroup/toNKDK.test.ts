import { describe, expect, it } from "vitest"
import { buttonGroupStructureFixturesTable } from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"
import { exportButtonGroupContentToStructure } from "./toNKDK"

describe("exportButtonGroupContentToStructure", () => {
  it.each(buttonGroupStructureFixturesTable)(
    "should export button group $name",
    ({ element: input, structured: expected }) => {
      const result = exportButtonGroupContentToStructure(mockContext, input)

      expect(result).toEqual(expected)
    }
  )
})
