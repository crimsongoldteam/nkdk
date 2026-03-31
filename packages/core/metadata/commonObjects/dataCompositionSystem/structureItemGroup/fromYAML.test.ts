import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { fixtureDynamicListStructureItemGroup, fixtureDynamicListStructureItemGroupYAML } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = {
  type: "StructureItemGroup",
}

describe("import StructureItemGroup from YAML", () => {
  it("imports full fixture", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fixtureDynamicListStructureItemGroupYAML,
    })

    expect(result).toEqual(fixtureDynamicListStructureItemGroup)
  })
})
