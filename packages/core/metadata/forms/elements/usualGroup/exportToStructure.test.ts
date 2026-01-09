import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToStructure"
import { usualGroupStructureFixtures } from "~/tests/fixtures/forms/usualGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { exportUsualGroupToStructure } from "./exportToStructure"

describe("exportUsualGroupToStructure", () => {
  it.each(usualGroupStructureFixtures)("should format $name", ({ element, structured }) => {
    const result = exportUsualGroupToStructure(mockСontext, element)

    expect(result.strings.join("\n")).toEqual(structured)
  })
})
