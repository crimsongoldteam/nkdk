import { describe, expect, it } from "vitest"
import { labelFieldStructureFixturesTable } from "~/metadata/forms/elements/labelField/__fixtures__/data"
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
