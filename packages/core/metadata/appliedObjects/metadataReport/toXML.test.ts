import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "../../../tests/appliedObject"
import { minimal } from "./__fixtures__/minimal"
import { MetadataReportRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataReport to XML", () => {
  it("exports minimal report using reference order and defaults", () => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataReportRules,
      fixture: "minimal.xml",
      importMetaUrl: import.meta.url,
      data: minimal,
    })

    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
