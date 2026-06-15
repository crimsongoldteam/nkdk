import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"

const rule: PropertyRule = { type: "MetadataConstant", yaml: "Константа" }

describe("import MetadataConstant from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("rejects full fixture with common form in local Form metadataTarget", () => {
    expect(() => testImportPropertyFromYAML({ rule, value: fullYAML, name: full.name })).toThrow(
      "Некорректный формат цели метаданных"
    )
  })

  it("imports minimal fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalYAML, name: minimal.name })
    expect(result).toEqual({ ...minimal, name: undefined })
  })

  it("does not silently round-trip full fixture with common form in local Form metadataTarget", () => {
    expect(() => testImportPropertyFromYAML({ rule, value: fullYAML, name: full.name })).toThrow(
      "Некорректный формат цели метаданных"
    )
  })
})
