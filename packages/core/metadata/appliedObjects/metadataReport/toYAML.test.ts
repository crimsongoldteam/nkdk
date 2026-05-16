import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataReportRules } from "./rules"
import type { MetadataReport } from "./types"

describe("export MetadataReport to YAML", () => {
  it("omits defaultValueYAML fields from minimal report", () => {
    expect(
      testExportAppliedObjectToYAML<MetadataReport>({
        rule: MetadataReportRules,
        data: minimal,
      })
    ).toEqual(minimalYAML)
  })

  it("exports explicit full report fields", () => {
    expect(
      testExportAppliedObjectToYAML<MetadataReport>({
        rule: MetadataReportRules,
        data: full,
      })
    ).toEqual(fullYAML)
  })
})
