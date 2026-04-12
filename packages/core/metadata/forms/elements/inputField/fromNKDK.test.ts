import { describe, expect, it } from "vitest"
import {
  inputFieldStructureFixturesTable,
  type InputFieldStructureFixture,
} from "~/metadata/forms/elements/inputField/__fixtures__/data"
import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importInputFieldFromStructure", () => {
  it.each(inputFieldStructureFixturesTable)(
    "should import input field $name",
    async (row: InputFieldStructureFixture) => {
      const { element: input, structured } = row
      const result = await testimportElementFromNKDK(mockContext, structured.strings.join("\n"))

      expect(result).toEqual(input)
    }
  )
})
