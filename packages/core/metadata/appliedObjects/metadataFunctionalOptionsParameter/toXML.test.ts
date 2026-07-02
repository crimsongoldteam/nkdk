import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "../../../tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataFunctionalOptionsParameterRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataFunctionalOptionsParameter to XML", () => {
  it("exports full", () => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataFunctionalOptionsParameterRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      data: full,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })

  it("exports minimal", () => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataFunctionalOptionsParameterRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
      data: minimal,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
