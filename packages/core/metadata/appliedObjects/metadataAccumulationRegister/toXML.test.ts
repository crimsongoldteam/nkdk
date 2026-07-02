import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML } from "../../orchestration"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { mockContextToXML } from "../../../tests/mockContext"
import { xmlExport } from "../../../xml/export/exporter"
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

  it("exports RecordType for balance registers", () => {
    const data = testImportAppliedObjectFromXML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
    })!

    const xmlData = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: {
        ...data,
        registerType: "Balance",
        standardAttributes: [{ itemType: "StandardAttributeDescription", name: "Active", comment: "changed" }],
      },
      rule: MetadataAccumulationRegisterRules,
    })
    const result = xmlExport(xmlData!)

    expect(result).toContain('<xr:StandardAttribute name="RecordType">')
    expect(result).toContain('<xr:StandardAttribute name="Active">')
    expect(result.indexOf('name="RecordType"')).toBeLessThan(result.indexOf('name="Active"'))
  })
})
