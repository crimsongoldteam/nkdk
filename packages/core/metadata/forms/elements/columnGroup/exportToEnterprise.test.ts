import { describe, expect, it } from "vitest"
import {
  fullColumnGroup,
  fullColumnGroupPartialEnterprise,
  fullColumnGroupTypedEnterprise,
  minimalColumnGroup,
  minimalColumnGroupPartialEnterprise,
} from "~/tests/fixtures/forms/columnGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { exportColumnGroupPartialToEnterprise, exportColumnGroupTypedToEnterprise } from "./exportToEnterprise"

describe("exportColumnGroupPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportColumnGroupPartialToEnterprise(mockСontext, fullColumnGroup)

    expect(result).toEqual(fullColumnGroupPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportColumnGroupPartialToEnterprise(mockСontext, minimalColumnGroup)

    expect(result).toEqual(minimalColumnGroupPartialEnterprise)
  })
})

describe("exportColumnGroupTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportColumnGroupTypedToEnterprise(mockСontext, fullColumnGroup)

    expect(result).toEqual(fullColumnGroupTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportColumnGroupTypedToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
