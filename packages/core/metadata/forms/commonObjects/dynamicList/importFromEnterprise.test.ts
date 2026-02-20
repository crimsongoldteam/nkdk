import { describe, expect, it } from "vitest"
import { fullDynamicList, fullDynamicListYAML } from "~/tests/fixtures/dynamicList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importDynamicListFromYAML } from "./fromYAML"

describe("importDynamicListFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importDynamicListFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importDynamicListFromYAML(mockContext, mockRule, fullDynamicListYAML)

    expect(result).toEqual(fullDynamicList)
  })
})
