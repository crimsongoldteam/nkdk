import { describe, expect, it } from "vitest"
import {
  checkBoxFieldContentStructureFixturesTable,
  checkBoxFieldStructureFixturesTable,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"
import { exportCheckBoxFieldContentToStructure, exportCheckBoxFieldToStructure } from "./exportToStructure"

describe("exportCheckBoxFieldToStructure", () => {
  describe("exportCheckBoxFieldToStructure", () => {
    it.each(checkBoxFieldStructureFixturesTable)(
      "should export check box field $name",
      ({ element: input, structured: expected }) => {
        const result = exportCheckBoxFieldToStructure(mockContext, input)

        expect(result).toEqual(expected)
      }
    )
  })
  describe("exportCheckBoxFieldContentToStructure", () => {
    it.each(checkBoxFieldContentStructureFixturesTable)(
      "should export check box field $name",
      ({ element: input, structured: expected }) => {
        const result = exportCheckBoxFieldContentToStructure(mockContext, input)

        expect(result).toEqual(expected)
      }
    )
  })
})
