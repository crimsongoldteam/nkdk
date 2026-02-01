import { describe, expect, it } from "vitest"
import { fullDynamicList, fullDynamicListEnterprise } from "~/tests/fixtures/dynamicList/data"
import { mockContext } from "~/tests/mockContext"
import { importDynamicListFromEnterprise } from "./importFromEnterprise"

describe("importDynamicListFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importDynamicListFromEnterprise(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importDynamicListFromEnterprise(mockContext, fullDynamicListEnterprise)

    expect(result).toEqual(fullDynamicList)
  })
})
