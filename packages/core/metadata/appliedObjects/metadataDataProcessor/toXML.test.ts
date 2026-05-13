import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataDataProcessorRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataDataProcessor to XML", () => {
  it.each([
    { name: "full", fixture: "full.xml", data: full },
    { name: "minimal", fixture: "minimal.xml", data: minimal },
  ])("should export $name", ({ fixture, data }) => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataDataProcessorRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
