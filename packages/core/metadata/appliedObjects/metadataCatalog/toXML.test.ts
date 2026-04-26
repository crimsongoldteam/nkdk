import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataCatalogRules } from "./rules"

describe("export MetadataCatalog to XML", () => {
  it("should export full.xml fixture", () => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      data: full,
    })
    expect(result).toEqual(expected)
  })

  it("should export minimal.xml fixture", () => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataCatalogRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
      data: minimal,
    })
    expect(result).toEqual(expected)
  })
})
