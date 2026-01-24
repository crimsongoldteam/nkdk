import { describe, expect, it } from "vitest"
import { fullUseAlways, fullUseAlwaysEnterprise } from "~/tests/fixtures/useAlways/data"
import { mockСontext } from "~/tests/mockContext"
import { importUseAlwaysFromEnterprise } from "./importFromEnterprise"

describe("importUseAlwaysFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importUseAlwaysFromEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importUseAlwaysFromEnterprise(mockСontext, fullUseAlwaysEnterprise)

    expect(result).toEqual(fullUseAlways)
  })
})
