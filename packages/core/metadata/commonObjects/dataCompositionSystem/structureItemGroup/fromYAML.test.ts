import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { fixtureDynamicListStructureItemGroup, fullStructureItemGroupYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "StructureItemGroup",
}

describe("import StructureItemGroup from YAML", () => {
  it("imports full fixture", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullStructureItemGroupYAML,
    })

    expect(result).toEqual(fixtureDynamicListStructureItemGroup)
  })
})
