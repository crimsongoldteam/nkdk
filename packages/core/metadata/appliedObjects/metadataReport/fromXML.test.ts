import { describe, expect, it } from "vitest"
import { testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataReportRules } from "./rules"
import type { MetadataReport } from "./types"

describe("import MetadataReport from XML", () => {
  it("imports minimal report", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataReport>({
        rule: MetadataReportRules,
        fixture: "minimal.xml",
        importMetaUrl: import.meta.url,
      })
    ).toEqual(minimal)
  })

  it("imports full report top-level fields", () => {
    const result = testImportAppliedObjectFromXML<MetadataReport>({
      rule: MetadataReportRules,
      fixture: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toMatchObject(full)
  })
})
