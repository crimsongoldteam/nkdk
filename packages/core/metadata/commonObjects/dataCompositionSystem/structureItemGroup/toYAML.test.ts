import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fixtureDynamicListStructureItemGroup, fullStructureItemGroupYAML } from "./__fixtures__/data"
import "./index"

const rule: PropertyRule = {
  type: "StructureItemGroup",
  yaml: "ГруппировкаКомпоновкиДанных",
}

describe("export StructureItemGroup to YAML", () => {
  it("exports full object", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: fixtureDynamicListStructureItemGroup,
    })

    expect(result).toEqual({
      ГруппировкаКомпоновкиДанных: fullStructureItemGroupYAML,
    })
  })
})
