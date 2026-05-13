import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataInformationRegisterRules } from "./rules"
import { MetadataInformationRegister } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataInformationRegister to XML", () => {
  it.each(["full.xml", "minimal.xml", "reg.xml"])("should export %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataInformationRegister>({
      rule: MetadataInformationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataInformationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
