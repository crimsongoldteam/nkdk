import { describe, expect, it } from "vitest"
import {
  fullColumnGroup,
  fullColumnGroupPartialEnterprise,
  fullColumnGroupTypedEnterprise,
  minimalColumnGroup,
  minimalColumnGroupPartialEnterprise,
} from "~/tests/fixtures/forms/columnGroup/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportColumnGroupPartialToEnterprise, exportColumnGroupTypedToEnterprise } from "./exportToEnterprise"

describe("exportColumnGroupPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportColumnGroupPartialToEnterprise(mockContext, mockRule, fullColumnGroup)

    expect(result).toEqual(fullColumnGroupPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportColumnGroupPartialToEnterprise(mockContext, mockRule, minimalColumnGroup)

    expect(result).toEqual(minimalColumnGroupPartialEnterprise)
  })
})

describe("exportColumnGroupTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportColumnGroupTypedToEnterprise(mockContext, mockRule, fullColumnGroup)

    expect(result).toEqual(fullColumnGroupTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportColumnGroupTypedToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
