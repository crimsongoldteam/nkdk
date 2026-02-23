import { describe, expect, it } from "vitest"
import {
  checkBoxFieldContentStructureFixturesTable,
  checkBoxFieldStructureFixturesTable,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext } from "~/tests/mockContext"
import { exportCheckBoxFieldContentToNKDK, exportCheckBoxFieldToNKDK } from "./toNKDK"

describe("exportCheckBoxFieldToStructure", () => {
  describe("exportCheckBoxFieldToStructure", () => {
    it.each(checkBoxFieldStructureFixturesTable)(
      "should export check box field $name",
      ({ element: input, structured: expected }) => {
        const result = exportCheckBoxFieldToNKDK({ context: mockContext, element: input })

        expect(result).toEqual(expected)
      }
    )
  })

  describe("exportCheckBoxFieldContentToStructure", () => {
    it.each(checkBoxFieldContentStructureFixturesTable)(
      "should export check box field $name",
      ({ element: input, structured: expected }) => {
        const result = exportCheckBoxFieldContentToNKDK({ context: mockContext, element: input })

        expect(result).toEqual(expected)
      }
    )
  })
})
