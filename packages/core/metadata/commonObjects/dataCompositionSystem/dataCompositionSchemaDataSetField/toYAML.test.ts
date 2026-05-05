import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import {
  fullDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetFieldYAML,
} from "./__fixtures__/data"
import "./types"

describe("export DataCompositionSchemaDataSetField to YAML", () => {
  it("exports full YAML", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: fullDataCompositionSchemaDataSetField,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: fullDataCompositionSchemaDataSetFieldYAML,
    })
  })
})
