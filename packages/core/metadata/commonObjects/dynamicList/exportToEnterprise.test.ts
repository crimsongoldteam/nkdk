import { describe, expect, it } from "vitest"
import { fullDynamicList, fullDynamicListEnterprise } from "~/tests/fixtures/dynamicList/data"
import { mockСontext } from "~/tests/mockContext"
import { exportDynamicListToEnterprise } from "./exportToEnterprise"

describe("exportDynamicListToEnterprise", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportDynamicListToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportDynamicListToEnterprise(mockСontext, fullDynamicList)

    expect(result).toEqual(fullDynamicListEnterprise)
  })
})
