import { describe, expect, it } from "vitest"
import type { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import "./types"

const rule: PropertyRule = { type: "MetadataReport", yaml: "Отчет" }

describe("import MetadataReport from YAML", () => {
  it("applies defaultValueYAML for minimal report", () => {
    expect(testImportPropertyFromYAML({ rule, value: minimalYAML })).toEqual({ ...minimal, name: undefined })
  })

  it("imports full report YAML", () => {
    expect(testImportPropertyFromYAML({ rule, value: fullYAML })).toMatchObject({ ...full, name: undefined })
  })
})
