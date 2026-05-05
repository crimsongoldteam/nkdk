import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"

const rule: PropertyRule = { type: "MetadataDocumentNumerator", yaml: "Нумератор" }

describe("export MetadataDocumentNumerator to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports full fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: full })
    expect(result).toEqual({ Нумератор: fullYAML })
  })

  it("exports minimal fixture — пустой объект без не-дефолтных полей не эмитит YAML-ключ", () => {
    const result = testExportPropertyToYAML({ rule, value: minimal })
    expect(result).toBeUndefined()
  })
})
