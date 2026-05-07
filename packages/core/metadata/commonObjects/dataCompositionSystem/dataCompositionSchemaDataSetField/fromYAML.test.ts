import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  folderDataCompositionSchemaDataSetField,
  folderDataCompositionSchemaDataSetFieldYAML,
  fullDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetFieldYAML,
  legacyDataCompositionSchemaDataSetFieldYAML,
  nestedDataCompositionSchemaDataSetField,
  nestedDataCompositionSchemaDataSetFieldYAML,
} from "./__fixtures__/data"
import "./types"

describe("import DataCompositionSchemaDataSetField from YAML", () => {
  it("imports full YAML", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: fullDataCompositionSchemaDataSetFieldYAML,
    })

    expect(result).toEqual(fullDataCompositionSchemaDataSetField)
  })

  it("imports legacy YAML without kind as field kind", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: legacyDataCompositionSchemaDataSetFieldYAML,
    })

    expect(result).toEqual(fullDataCompositionSchemaDataSetField)
  })

  it("imports nested data set kind", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: nestedDataCompositionSchemaDataSetFieldYAML,
    })

    expect(result).toEqual(nestedDataCompositionSchemaDataSetField)
  })

  it("imports folder kind", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: folderDataCompositionSchemaDataSetFieldYAML,
    })

    expect(result).toEqual(folderDataCompositionSchemaDataSetField)
  })
})
