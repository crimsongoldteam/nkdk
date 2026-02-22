import { describe, expect, it } from "vitest"
import { usualGroupStructureFixtures } from "~/tests/fixtures/forms/usualGroup/data"
import { testImportElementFromNKDK } from "~/tests/fromNKDK"
import { mockContext } from "~/tests/mockContext"

describe("importUsualGroupFromStructure", () => {
  it.each(usualGroupStructureFixtures)("should import $name from structure", async ({ element, structured }) => {
    const result = await testImportElementFromNKDK(mockContext, structured)

    expect(result).toEqual(element)
  })
})
