import { describe, expect, it } from "vitest"
import {
  checkBoxFieldContentStructureFixturesTable,
  checkBoxFieldStructureFixturesTable,
} from "~/metadata/forms/elements/checkBoxField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { exportCheckBoxFieldContentToNKDK, exportCheckBoxFieldToNKDK } from "./toNKDK"

describe("exportCheckBoxFieldToStructure", () => {
  describe("exportCheckBoxFieldToStructure", () => {
    it.each(checkBoxFieldStructureFixturesTable)("should export check box field $description", ({ element, nkdk }) => {
      const result = exportCheckBoxFieldToNKDK({ context: mockContext, element: element })

      expect(result).toEqual(nkdk)
    })
  })

  describe("exportCheckBoxFieldContentToStructure", () => {
    it.each(checkBoxFieldContentStructureFixturesTable)(
      "should export check box field $description",
      ({ element, nkdk }) => {
        const result = exportCheckBoxFieldContentToNKDK({ context: mockContext, element: element })

        expect(result).toEqual(nkdk)
      }
    )
  })
})
