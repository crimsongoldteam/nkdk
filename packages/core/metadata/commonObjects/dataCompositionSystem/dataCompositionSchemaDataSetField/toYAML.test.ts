import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import {
  folderDataCompositionSchemaDataSetField,
  folderDataCompositionSchemaDataSetFieldYAML,
  fullDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetFieldYAML,
  nestedDataCompositionSchemaDataSetField,
  nestedDataCompositionSchemaDataSetFieldYAML,
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

  it("exports nested data set kind", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: nestedDataCompositionSchemaDataSetField,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: nestedDataCompositionSchemaDataSetFieldYAML,
    })
  })

  it("exports folder kind", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: folderDataCompositionSchemaDataSetField,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: folderDataCompositionSchemaDataSetFieldYAML,
    })
  })
})
