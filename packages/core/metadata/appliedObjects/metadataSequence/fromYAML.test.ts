import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testExportPropertyToYAML } from "../../../tests/property/exportPropertyToYAML"
import { testImportPropertyFromYAML } from "../../../tests/property/importPropertyFromYAML"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"

const rule: PropertyRule = { type: "MetadataSequence", yaml: "Последовательность" }
type MetadataSequenceDimension = NonNullable<typeof full.dimensions>[number]

describe("import MetadataSequence from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports full fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: fullYAML, name: full.name })
    expect(result).toEqual({
      ...full,
      name: undefined,
      dimensions: full.dimensions?.map((dimension: MetadataSequenceDimension) =>
        dimension.name === "ИзмерениеПоУмолчанию" ? { ...dimension, synonym: undefined } : dimension
      ),
    })
  })

  it("imports minimal fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalYAML, name: minimal.name })
    expect(result).toEqual({ ...minimal, name: undefined })
  })

  it("round-trip: full — import затем export даёт тот же YAML (parsed)", () => {
    const imported = testImportPropertyFromYAML({ rule, value: fullYAML, name: full.name })
    const exported = testExportPropertyToYAML({ rule, value: imported, name: full.name })
    expect(exported).toEqual({ Последовательность: fullYAML })
  })
})
