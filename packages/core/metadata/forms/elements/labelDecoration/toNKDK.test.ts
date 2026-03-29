import { describe, expect, it } from "vitest"
import { labelDecorationStructureFixturesTable } from "~/metadata/forms/elements/labelDecoration/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { exportLabelDecorationToNKDK } from "./toNKDK"

describe("exportLabelDecorationToStructure", () => {
  it.each(labelDecorationStructureFixturesTable)(
    "should export label decoration $name",
    ({ element: input, structured: expected }) => {
      const result = exportLabelDecorationToNKDK({ context: mockContext, element: input })

      expect(result).toEqual(expected)
    }
  )
})
