import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataChartOfAccountsRules } from "./rules"
import { MetadataChartOfAccounts } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataChartOfAccounts from XML", () => {
  it("imports chart of accounts fields and accounting flags", () => {
    const result = testImportAppliedObjectFromXML<MetadataChartOfAccounts>({
      rule: MetadataChartOfAccountsRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(result?.itemType).toBe("MetadataChartOfAccounts")
    expect(result?.extDimensionTypes).toBe("ChartOfCharacteristicTypes.ВидыСубконто")
    expect(result?.maxExtDimensionCount).toBe(4)
    expect(result?.accountingFlags?.map(({ name }) => name)).toEqual([
      "ПризнакУчетаВсеСвойства",
      "ПризнакУчетаПоУмолчанию",
    ])
    expect(result?.extDimensionAccountingFlags?.map(({ name }) => name)).toEqual([
      "ПризнакУчетаСубконтоВсеСвойства",
      "ПризнакУчетаСубконтоПоУмолчанию",
    ])
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataChartOfAccounts>({
      rule: MetadataChartOfAccountsRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataChartOfAccountsRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
