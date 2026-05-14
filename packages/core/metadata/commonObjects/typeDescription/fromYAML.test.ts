import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromYAML } from "./fromYAML"
import { TypeDescriptionYAML } from "./types"

const importUnsafeTypeDescriptionFromYAML = (value: unknown) =>
  importTypeDescriptionFromYAML(mockContext, mockRule, value as TypeDescriptionYAML)

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

  it("should parse empty type ids as undefined", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, { ИдентификаторТипа: [] })
    expect(result).toBeUndefined()
  })

  it("should ignore string type ids property from YAML", () => {
    const result = importUnsafeTypeDescriptionFromYAML({ ИдентификаторТипа: "8c1e3694-da12-44d5-8b1f-d134b89a1282" })
    expect(result).toBeUndefined()
  })

  it("should ignore non-string type ids from YAML", () => {
    const result = importUnsafeTypeDescriptionFromYAML({ ИдентификаторТипа: [123] })
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should import type from YAML: $enterprise", ({ internal, YAML: enterprise }) => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, enterprise)
    expect(result).toEqual(internal)
  })

  it("should import known system enumeration type from explicit YAML form", () => {
    const result = importTypeDescriptionFromYAML(
      mockContext,
      mockRule,
      "СистемноеПеречисление.ПроверкаЗаполнения"
    )

    expect(result).toEqual({ type: ["FillChecking"] })
  })

  it("should keep system enumeration type with complex suffix unchanged during YAML import", () => {
    const result = importTypeDescriptionFromYAML(
      mockContext,
      mockRule,
      "СистемноеПеречисление.ПроверкаЗаполнения.Anything"
    )

    expect(result).toEqual({ type: ["СистемноеПеречисление.ПроверкаЗаполнения.Anything"] })
  })
})
