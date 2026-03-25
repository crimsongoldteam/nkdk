import { describe, expect, it } from "vitest"
import { fullDynamicList, fullDynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportDynamicListToYAML } from "./toYAML"

describe("exportDynamicListToYAML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportDynamicListToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportDynamicListToYAML(mockContext, mockRule, fullDynamicList)

    expect(result).toEqual(fullDynamicListYAML)
  })
})
