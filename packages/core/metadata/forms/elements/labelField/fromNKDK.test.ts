import { describe, expect, it } from "vitest"
import { labelFieldStructureFixturesTable } from "~/tests/fixtures/forms/labelField/data"
import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importLabelFieldFromStructure", () => {
  it.each(labelFieldStructureFixturesTable)(
    "should import label field $name",
    async ({ element: label, structured }) => {
      const result = await testimportElementFromNKDK(mockContext, structured.strings)

      expect(result).toEqual(label)
    }
  )
})
