import { describe, expect, it } from "vitest"
import { usualGroupStructureFixtures } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { exportUsualGroupToStructure } from "./exportToStructure"

describe("exportUsualGroupToStructure", () => {
  it.each(usualGroupStructureFixtures)("should format $name", ({ element, structured }) => {
    const result = exportUsualGroupToStructure(mockContext, element)

    expect(result.join("\n")).toEqual(structured)
  })
})
