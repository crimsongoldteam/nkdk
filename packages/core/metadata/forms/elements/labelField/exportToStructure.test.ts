import { describe, expect, it } from "vitest"
import { labelFieldStructureFixturesTable } from "~/tests/fixtures/forms/labelField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportLabelFieldToStructure } from "./exportToStructure"

describe("exportLabelFieldToStructure", () => {
  it.each(labelFieldStructureFixturesTable)(
    "should export label field $name",
    ({ element: label, structured: expected }) => {
      const result = exportLabelFieldToStructure(mockСontext, label)

      expect(result.strings).toEqual(expected.strings)
    }
  )
})
