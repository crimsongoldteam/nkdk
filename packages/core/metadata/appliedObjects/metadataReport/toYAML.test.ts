import { describe, expect, it } from "vitest"
import type { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import "./types"

const rule: PropertyRule = { type: "MetadataReport", yaml: "Отчет" }

describe("export MetadataReport to YAML", () => {
  it("omits defaultValueYAML fields from minimal report", () => {
    expect(testExportPropertyToYAML({ rule, value: minimal })).toEqual({ Отчет: minimalYAML })
  })

  it("exports explicit full report fields", () => {
    expect(testExportPropertyToYAML({ rule, value: full })).toEqual({ Отчет: fullYAML })
  })
})
