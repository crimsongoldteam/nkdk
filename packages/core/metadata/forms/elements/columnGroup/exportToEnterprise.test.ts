import { describe, expect, it } from "vitest"
import { fullColumnGroup, fullColumnGroupEnterprise, minimalColumnGroup, minimalColumnGroupEnterprise } from "~/tests/fixtures/forms/columnGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { exportColumnGroupToEnterprise } from "./exportToEnterprise"

describe("exportColumnGroupToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportColumnGroupToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportColumnGroupToEnterprise(mockСontext, fullColumnGroup)

    expect(result).toEqual(fullColumnGroupEnterprise)
  })

  it("should export minimal", () => {
    const result = exportColumnGroupToEnterprise(mockСontext, minimalColumnGroup)

    expect(result).toEqual(minimalColumnGroupEnterprise)
  })
})

