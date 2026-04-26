import { describe, expect, it } from "vitest"
import { testImportAppliedObjectFromXML, testExportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataSequenceRules } from "./rules"
import { MetadataSequence } from "./types"

describe("import MetadataSequence from XML", () => {
  it("should import full", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataSequence>({
        rule: MetadataSequenceRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("should import minimal", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataSequence>({
        rule: MetadataSequenceRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const data = testImportAppliedObjectFromXML<MetadataSequence>({
        rule: MetadataSequenceRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
      const { result, expected } = testExportAppliedObjectToXML({
        rule: MetadataSequenceRules,
        importMetaUrl: import.meta.url,
        fixture,
        data: data!,
      })
      expect(result).toEqual(expected)
    }
  )
})
