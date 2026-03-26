import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { fullFilterFromYAML, fullFilterYAML } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Filter",
}

describe("import Filter from YAML", () => {
  it("imports full from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullFilterYAML,
    })

    expect(result).toEqual(fullFilterFromYAML)
  })
})
