import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "../../../tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataSettingsStorageRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataSettingsStorage to XML", () => {
  it.each([
    { fixture: "full.xml", data: full },
    { fixture: "minimal.xml", data: minimal },
  ])("should export $fixture", ({ fixture, data }) => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataSettingsStorageRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
