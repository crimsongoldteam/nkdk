import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromYAML } from "./fromYAML"

describe("importTypeDescriptionFromYAML", () => {
  it("should parse undefined type description", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should parse empty string as undefined", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, "")
    expect(result).toBeUndefined()
  })

  it("should parse whitespace string as undefined", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, "   ")
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should import type from YAML: $enterprise", ({ internal, YAML: enterprise }) => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, enterprise)
    expect(result).toEqual(internal)
  })
})
