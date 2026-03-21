import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { exportTypeDescriptionToYAML } from "./toYAML"

describe("exportTypeDescriptionToYAML", () => {
  it("should format undefined type description", () => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should export composite type to YAML: $enterprise", ({ internal, YAML: enterprise }) => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, internal)
    expect(result).toEqual(enterprise)
  })
})
