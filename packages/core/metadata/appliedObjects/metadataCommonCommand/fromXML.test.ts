import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { full } from "./__fixtures__/full"
import { MetadataCommonCommandRules } from "./rules"
import { MetadataCommonCommand } from "./types"

const normalizeLineEndings = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

describe("import MetadataCommonCommand from XML", () => {
  it("imports full fixture", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataCommonCommand>({
        rule: MetadataCommonCommandRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("round-trip: full.xml — import затем export совпадает с исходным XML", () => {
    const data = testImportAppliedObjectFromXML<MetadataCommonCommand>({
      rule: MetadataCommonCommandRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataCommonCommandRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      data: data!,
    })

    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
