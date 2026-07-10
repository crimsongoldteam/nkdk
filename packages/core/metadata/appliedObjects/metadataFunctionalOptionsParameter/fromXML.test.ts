import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataFunctionalOptionsParameterRules } from "./rules"
import { MetadataFunctionalOptionsParameter } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataFunctionalOptionsParameter from XML", () => {
  it("should import full", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataFunctionalOptionsParameter>({
        rule: MetadataFunctionalOptionsParameterRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("should import minimal", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataFunctionalOptionsParameter>({
        rule: MetadataFunctionalOptionsParameterRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s — import затем export совпадает с исходным XML", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataFunctionalOptionsParameter>({
      rule: MetadataFunctionalOptionsParameterRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataFunctionalOptionsParameterRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
