import { describe, expect, it } from "vitest"
import { checkBoxFieldStructureFixturesTable } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportCheckBoxFieldToStructure } from "./exportToStructure"

describe("exportCheckBoxFieldToStructure", () => {
  it.each(checkBoxFieldStructureFixturesTable)(
    "should export check box field $name",
    ({ element: input, structured: expected }) => {
      const result = exportCheckBoxFieldToStructure(mockСontext, input)

      expect(result.strings).toEqual(expected.strings)
    }
  )
})
