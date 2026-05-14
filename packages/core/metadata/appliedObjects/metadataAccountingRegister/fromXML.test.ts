import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataAccountingRegisterRules } from "./rules"
import { MetadataAccountingRegister } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataAccountingRegister from XML", () => {
  it("imports accounting register fields and children", () => {
    const result = testImportAppliedObjectFromXML<MetadataAccountingRegister>({
      rule: MetadataAccountingRegisterRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(result?.itemType).toBe("MetadataAccountingRegister")
    expect(result?.chartOfAccounts).toBe("ChartOfAccounts.ПланСчетовВсеСвойства")
    expect(result?.correspondence).toBe(true)
    expect(result?.periodAdjustmentLength).toBe(3)
    expect(result?.dimensions?.map(({ name }) => name)).toEqual([
      "ИзмерениеВсеСвойства",
      "ИспользоватьХранилищеДвоичныхДанных",
    ])
    expect(result?.resources?.map(({ name }) => name)).toEqual(["РесурсВсеСвойства", "ИзмерениеИндексировать"])
    expect(result?.attributes?.map(({ name }) => name)).toEqual(["РеквизитВсеСвойства", "РеквизитПоУмолчанию"])
    expect(result?.commands?.map(({ name }) => name)).toEqual(["Команда1"])
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataAccountingRegister>({
      rule: MetadataAccountingRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataAccountingRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
