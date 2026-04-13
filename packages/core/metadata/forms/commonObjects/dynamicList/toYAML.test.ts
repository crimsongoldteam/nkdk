import { describe, expect, it } from "vitest"
import { fullDynamicList, fullDynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { exportPropertyToYAML, PropertyRule } from "~/metadata/orchestration"
import { mockContextToTypedYAML } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "DynamicList",
  yaml: "ДинамическийСписок",
}

describe("export DynamicList to YAML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: fullDynamicList,
    })
    expect(result).toEqual({ ДинамическийСписок: fullDynamicListYAML })
  })
})
