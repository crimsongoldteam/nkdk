import { describe, expect, it } from "vitest"
import {
  inputFieldStructureFixturesTable,
  type InputFieldStructureFixture,
} from "~/tests/fixtures/forms/inputField/data.ts"
import { testImportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importInputFieldFromStructure", () => {
  it.each(inputFieldStructureFixturesTable)(
    "should import input field $name",
    async (row: InputFieldStructureFixture) => {
      const { element: input, structured } = row
      const result = await testImportElementFromNKDK(mockContext, structured)

      expect(result).toEqual(input)
    }
  )
})
