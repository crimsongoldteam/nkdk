import { describe, expect, it } from "vitest"
import { usualGroupStructureFixtures } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { exportUsualGroupToNKDK } from "./toNKDK"

describe("export UsualGroup to NKDK", () => {
  it.each(usualGroupStructureFixtures)("should format $name", ({ element, structured }) => {
    const result = exportUsualGroupToNKDK({ context: mockContext, element })

    expect(result.strings.join("\n")).toEqual(structured.strings.join("\n"))
  })
})
