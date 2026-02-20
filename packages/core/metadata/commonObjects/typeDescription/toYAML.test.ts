import { describe, expect, it } from "vitest"
import { typeFixturesTable } from "../../../tests/fixtures/typeDescription/data"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportTypeDescriptionToYAML } from "./toYAML"

describe("exportTypeDescriptionToYAML", () => {
  it("should format undefined type description", () => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should export composite type to YAML: $enterprise", ({ internal, enterprise }) => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, internal)
    expect(result).toEqual(enterprise)
  })
})
