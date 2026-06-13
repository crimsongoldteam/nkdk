import { describe, expect, it } from "vitest"
import { testImportAppliedObjectFromYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataReportRules } from "./rules"
import type { MetadataReport } from "./types"

describe("import MetadataReport from YAML", () => {
  it("applies implicitValueYAML for minimal report", () => {
    expect(
      testImportAppliedObjectFromYAML<MetadataReport>({
        rule: MetadataReportRules,
        yaml: minimalYAML,
        name: "ОтчетПоУмолчанию",
      })
    ).toEqual(minimal)
  })

  it("imports full report YAML", () => {
    expect(
      testImportAppliedObjectFromYAML<MetadataReport>({
        rule: MetadataReportRules,
        yaml: fullYAML,
        name: "ОтчетВсеСвойства",
      })
    ).toMatchObject(full)
  })
})
