import { describe, expect, it } from "vitest"
import {
  checkBoxFieldContentStructureFixturesTable,
  checkBoxFieldStructureFixturesTable,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportCheckBoxFieldContentToStructure, exportCheckBoxFieldToStructure } from "./exportToStructure"

describe("exportCheckBoxFieldToStructure", () => {
  describe("exportCheckBoxFieldToStructure", () => {
    it.each(checkBoxFieldStructureFixturesTable)(
      "should export check box field $name",
      ({ element: input, structured: expected }) => {
        const result = exportCheckBoxFieldToStructure(mockСontext, input)

        expect(result.strings).toEqual(expected.strings)
      }
    )
  })
  describe("exportCheckBoxFieldContentToStructure", () => {
    it.each(checkBoxFieldContentStructureFixturesTable)(
      "should export check box field $name",
      ({ element: input, structured: expected }) => {
        const result = exportCheckBoxFieldContentToStructure(mockСontext, input)

        expect(result.strings).toEqual(expected.strings)
      }
    )
  })
})
