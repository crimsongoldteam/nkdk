import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "../../../tests/appliedObject"
import { fullFromXML } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataHTTPServiceRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataHTTPService to XML", () => {
  it.each([
    { fixture: "full.xml", data: fullFromXML },
    { fixture: "minimal.xml", data: minimal },
  ])("should export $fixture", ({ fixture, data }) => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataHTTPServiceRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })

    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
