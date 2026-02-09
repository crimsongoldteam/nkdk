import { describe, expect, it } from "vitest"
import { labelFieldStructureFixturesTable } from "~/tests/fixtures/forms/labelField/data"
import { mockContext } from "~/tests/mockContext"
import { exportLabelFieldContentToStructure, exportLabelFieldToStructure } from "./exportToStructure"

describe("exportLabelFieldToStructure", () => {
  describe("exportLabelFieldToStructure", () => {
    it.each(labelFieldStructureFixturesTable)(
      "should export label field $name",
      ({ element: label, structured: expected }) => {
        const result = exportLabelFieldToStructure(mockContext, label)

        expect(result.strings).toEqual(expected.strings)
      }
    )
  })

  describe("exportLabelFieldContentToStructure", () => {
    it.each(labelFieldStructureFixturesTable)(
      "should export label field $name",
      ({ element: label, content: content }) => {
        const result = exportLabelFieldContentToStructure(mockContext, label)

        expect(result.strings).toEqual(content.strings)
      }
    )
  })
})
