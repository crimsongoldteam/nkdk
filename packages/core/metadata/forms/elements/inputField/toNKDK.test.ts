import { describe, expect, it } from "vitest"
import { inputFieldStructureFixturesTable } from "~/metadata/forms/elements/inputField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { exportInputFieldToNKDK } from "./toNKDK"

describe("exportInputFieldToStructure", () => {
  it.each(inputFieldStructureFixturesTable)(
    "should export input field $name",
    ({ element: input, structured: expected }) => {
      const result = exportInputFieldToNKDK({ context: mockContext, element: input })

      expect(result).toEqual(expected)
    }
  )
})
