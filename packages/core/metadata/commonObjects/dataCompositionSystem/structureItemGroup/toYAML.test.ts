import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fullStructureItemGroup, fullStructureItemGroupYAMLExport } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "StructureItemGroup",
  yaml: "ГруппировкаКомпоновкиДанных",
}

describe("export StructureItemGroup to YAML", () => {
  it("exports full object", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: fullStructureItemGroup,
    })

    expect(result).toEqual({
      ГруппировкаКомпоновкиДанных: fullStructureItemGroupYAMLExport,
    })
  })
})
