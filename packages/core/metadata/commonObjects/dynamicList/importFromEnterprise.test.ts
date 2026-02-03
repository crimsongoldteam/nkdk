import { describe, expect, it } from "vitest"
import { fullDynamicList, fullDynamicListEnterprise } from "~/tests/fixtures/dynamicList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importDynamicListFromEnterprise } from "./importFromEnterprise"

describe("importDynamicListFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importDynamicListFromEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importDynamicListFromEnterprise(mockContext, mockRule, fullDynamicListEnterprise)

    expect(result).toEqual(fullDynamicList)
  })
})
