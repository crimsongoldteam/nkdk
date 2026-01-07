import { describe, expect, it } from "vitest"
import { fullColumnGroup, fullColumnGroupEnterprise, minimalColumnGroup, minimalColumnGroupEnterprise } from "~/tests/fixtures/forms/columnGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { importColumnGroupFromEnterprise } from "./importFromEnterprise"

describe("importColumnGroupFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importColumnGroupFromEnterprise(mockСontext, undefined, fullColumnGroup.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importColumnGroupFromEnterprise(mockСontext, fullColumnGroupEnterprise, fullColumnGroup.name)
    result!.id = "1"

    expect(result).toEqual(fullColumnGroup)
  })

  it("should import minimal", () => {
    const result = importColumnGroupFromEnterprise(mockСontext, minimalColumnGroupEnterprise, minimalColumnGroup.name)
    result!.id = "1"

    expect(result).toEqual(minimalColumnGroup)
  })
})

