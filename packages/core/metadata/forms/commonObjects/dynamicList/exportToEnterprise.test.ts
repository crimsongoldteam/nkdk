import { describe, expect, it } from "vitest"
import { fullDynamicList, fullDynamicListEnterprise } from "~/tests/fixtures/dynamicList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportDynamicListToEnterprise } from "./exportToEnterprise"

describe("exportDynamicListToEnterprise", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportDynamicListToEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportDynamicListToEnterprise(mockContext, mockRule, fullDynamicList)

    expect(result).toEqual(fullDynamicListEnterprise)
  })
})
