import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataAccumulationRegisterRules } from "./rules"
import { MetadataAccumulationRegister } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataAccumulationRegister to XML", () => {
  it.each(["full.xml", "minimal.xml"])("should export %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataAccumulationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
