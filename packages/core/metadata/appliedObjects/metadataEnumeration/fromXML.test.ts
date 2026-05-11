import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataEnumerationRules } from "./rules"
import { MetadataEnumeration } from "./types"

describe("import MetadataEnumeration from XML", () => {
  it("should import full", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataEnumeration>({
        rule: MetadataEnumerationRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("should import minimal", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataEnumeration>({
        rule: MetadataEnumerationRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s — import затем export совпадает с исходным XML", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataEnumeration>({
      rule: MetadataEnumerationRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataEnumerationRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(result).toEqual(expected)
  })
})
