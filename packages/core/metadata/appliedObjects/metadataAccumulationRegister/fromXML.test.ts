import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataAccumulationRegisterRules } from "./rules"
import { MetadataAccumulationRegister } from "./types"

describe("import MetadataAccumulationRegister from XML", () => {
  it("imports minimal accumulation register defaults and keeps resource fixture content explicit", () => {
    const result = testImportAppliedObjectFromXML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture: "minimal.xml",
    })

    expect(result?.itemType).toBe("MetadataAccumulationRegister")
    expect(result?.name).toBe("РегистрНакопленияПоУмолчанию")
    expect(result?.registerType).toBeUndefined()
    expect(result?.enableTotalsSplitting).toBeUndefined()
    expect(result?.resources?.[0]?.name).toBe("Ресурс1")
  })

  it("imports turnover register fields, dimensions and aggregates", () => {
    const result = testImportAppliedObjectFromXML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(result?.registerType).toBe("Turnovers")
    expect(result?.enableTotalsSplitting).toBe(false)
    expect(result?.resources?.map(({ name }) => name)).toEqual(["РесурсВсеСвойства", "ИзмерениеИндексировать"])
    expect(result?.dimensions?.map(({ name }) => name)).toEqual([
      "ИзмерениеВсеСвойства",
      "ИспользоватьХранилищеДвоичныхДанных",
    ])
    expect(result?.attributes?.map(({ name }) => name)).toEqual(["РеквизитВсеСвойства", "РеквизитПоУмолчанию"])
    expect(result?.dimensions?.[0]?.useInTotals).toBeUndefined()
  })

  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
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
      expect(result.replace(/\r\n/g, "\n")).toEqual(expected.replace(/\r\n/g, "\n"))
    }
  )
})
