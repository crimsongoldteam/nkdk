import { describe, expect, it } from "vitest"
import { usualGroupStructureFixtures } from "~/tests/fixtures/forms/usualGroup/data"
import { testImportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("import UsualGroup from NKDK", () => {
  it.each(usualGroupStructureFixtures)("should import $name", async ({ element, structured }) => {
    const result = await testImportElementFromNKDK(mockContext, structured.strings)

    expect(result).toEqual(element)
  })
})
