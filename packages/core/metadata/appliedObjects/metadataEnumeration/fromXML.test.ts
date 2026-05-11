import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataEnumerationRules } from "./rules"
import { MetadataEnumeration } from "./types"

describe("import MetadataEnumeration from XML", () => {
  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
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
    }
  )
})
