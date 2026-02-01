import { describe, expect, it } from "vitest"
import {
  fullColumnGroup,
  fullColumnGroupPartialEnterprise,
  fullColumnGroupTypedEnterprise,
  minimalColumnGroup,
  minimalColumnGroupPartialEnterprise,
} from "~/tests/fixtures/forms/columnGroup/data"
import { mockContext } from "~/tests/mockContext"
import { exportColumnGroupPartialToEnterprise, exportColumnGroupTypedToEnterprise } from "./exportToEnterprise"

describe("exportColumnGroupPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportColumnGroupPartialToEnterprise(mockContext, fullColumnGroup)

    expect(result).toEqual(fullColumnGroupPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportColumnGroupPartialToEnterprise(mockContext, minimalColumnGroup)

    expect(result).toEqual(minimalColumnGroupPartialEnterprise)
  })
})

describe("exportColumnGroupTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportColumnGroupTypedToEnterprise(mockContext, fullColumnGroup)

    expect(result).toEqual(fullColumnGroupTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportColumnGroupTypedToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })
})
