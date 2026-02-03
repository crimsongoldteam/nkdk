import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { typeFixturesTable } from "../../../tests/fixtures/typeDescription/data"
import { importTypeDescriptionFromEnterprise } from "./importFromEnterprise"

describe("importTypeDescriptionFromEnterprise", () => {
  it("should parse undefined type description", () => {
    const result = importTypeDescriptionFromEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should parse empty string as undefined", () => {
    const result = importTypeDescriptionFromEnterprise(mockContext, mockRule, "")
    expect(result).toBeUndefined()
  })

  it("should parse whitespace string as undefined", () => {
    const result = importTypeDescriptionFromEnterprise(mockContext, mockRule, "   ")
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should import type from Enterprise: $enterprise", ({ internal, enterprise }) => {
    const result = importTypeDescriptionFromEnterprise(mockContext, mockRule, enterprise)
    expect(result).toEqual(internal)
  })
})
