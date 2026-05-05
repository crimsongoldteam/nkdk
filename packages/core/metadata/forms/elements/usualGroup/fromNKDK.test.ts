import { describe, expect, it } from "vitest"
import { usualGroupStructureFixtures } from "~/metadata/forms/elements/usualGroup/__fixtures__/data"
import { testimportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("import UsualGroup from NKDK", () => {
  it.each(usualGroupStructureFixtures)("should import $name", async ({ element, structured }) => {
    const result = await testimportElementFromNKDK(mockContext, structured.strings)

    expect(result).toEqual(element)
  })
})
