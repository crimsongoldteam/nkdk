import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { typeFixturesTable } from "../../../tests/fixtures/typeDescription/data"
import { importTypeDescriptionFromEnterprise } from "./importFromEnterprise"

describe("importTypeDescriptionFromEnterprise", () => {
  it("should parse undefined type description", () => {
    const result = importTypeDescriptionFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should parse empty string as undefined", () => {
    const result = importTypeDescriptionFromEnterprise(mockСontext, "")
    expect(result).toBeUndefined()
  })

  it("should parse whitespace string as undefined", () => {
    const result = importTypeDescriptionFromEnterprise(mockСontext, "   ")
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable.filter((fixture) => typeof fixture.enterprise === "string"))(
    "should import type from Enterprise: $enterprise",
    ({ internal, enterprise }) => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, enterprise as string)
      expect(result).toEqual(internal)
    }
  )

  it.each(typeFixturesTable.filter((fixture) => Array.isArray(fixture.enterprise)))(
    "should import composite type from Enterprise: $enterprise",
    ({ internal, enterprise }) => {
      const result = importTypeDescriptionFromEnterprise(mockСontext, enterprise as string[])
      expect(result).toEqual(internal)
    }
  )
})
