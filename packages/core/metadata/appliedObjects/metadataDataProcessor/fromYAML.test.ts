import { describe, expect, it } from "vitest"
import { testImportAppliedObjectFromYAML } from "../../../tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataDataProcessorRules } from "./rules"
import { MetadataDataProcessor } from "./types"

describe("import MetadataDataProcessor from YAML", () => {
  it("should import full", () => {
    const result = testImportAppliedObjectFromYAML<MetadataDataProcessor>({
      rule: MetadataDataProcessorRules,
      yaml: fullYAML,
      name: "ОбработкаВсеСвойства",
    })
    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = testImportAppliedObjectFromYAML<MetadataDataProcessor>({
      rule: MetadataDataProcessorRules,
      yaml: minimalYAML,
      name: "ОбработкаПоУмолчанию",
    })
    const { synonym: _synonym, ...expected } = minimal
    expect(result).toEqual(expected)
  })
})
