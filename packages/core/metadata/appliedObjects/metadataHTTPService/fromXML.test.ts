import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { fullFromXML } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataHTTPServiceRules } from "./rules"
import { MetadataHTTPService } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataHTTPService from XML", () => {
  it("should import full with URL templates and methods", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataHTTPService>({
        rule: MetadataHTTPServiceRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(fullFromXML)
  })

  it("should import minimal", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataHTTPService>({
        rule: MetadataHTTPServiceRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const data = testImportAppliedObjectFromXML<MetadataHTTPService>({
        rule: MetadataHTTPServiceRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
      const { result, expected } = testExportAppliedObjectToXML({
        rule: MetadataHTTPServiceRules,
        importMetaUrl: import.meta.url,
        fixture,
        data: data!,
      })
      expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
    }
  )
})
