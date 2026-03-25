import { describe, expect, it } from "vitest"
import { fullDynamicList, fullDynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"

const rule: PropertyRule = {
  type: "DynamicList",
}

describe("import DynamicList from YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullDynamicListYAML,
    })
    expect(result).toEqual(fullDynamicList)
  })
})
