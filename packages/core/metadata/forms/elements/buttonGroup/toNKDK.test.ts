import { describe, expect, it } from "vitest"
import { buttonGroupStructureFixturesTable } from "~/tests/fixtures/forms/buttonGroup/data"
import { mockContext } from "~/tests/mockContext"
import { exportButtonGroupContentToNKDK } from "./toNKDK"

describe("exportButtonGroupContentToStructure", () => {
  it.each(buttonGroupStructureFixturesTable)(
    "should export button group $name",
    ({ element: input, structured: expected }) => {
      const result = exportButtonGroupContentToNKDK({ context: mockContext, element: input })

      expect(result).toEqual(expected)
    }
  )
})
