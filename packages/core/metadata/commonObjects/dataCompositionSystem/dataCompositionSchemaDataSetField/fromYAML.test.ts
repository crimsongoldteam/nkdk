import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  fullDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetFieldYAML,
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
})
