import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataChartOfCalculationTypesRules } from "./rules"
import { MetadataChartOfCalculationTypes } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataChartOfCalculationTypes from XML", () => {
  it("imports chart of calculation types fields and child objects", () => {
    const result = testImportAppliedObjectFromXML<MetadataChartOfCalculationTypes>({
      rule: MetadataChartOfCalculationTypesRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(result?.itemType).toBe("MetadataChartOfCalculationTypes")
    expect(result?.codeType).toBe("Number")
    expect(result?.dependenceOnCalculationTypes).toBe("OnActionPeriod")
    expect(result?.actionPeriodUse).toBe(true)
    expect(result?.attributes?.map(({ name }: { name: string }) => name)).toEqual([
      "РеквизитВсеСвойства",
      "РеквизитХранилище",
      "РеквизитПоУмолчанию",
    ])
    expect(result?.tabularSections?.map(({ name }: { name: string }) => name)).toEqual([
      "ТабличнаяЧастьПоУмолчанию",
      "ТабличнаяЧастьВсеСвойства",
    ])
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataChartOfCalculationTypes>({
      rule: MetadataChartOfCalculationTypesRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataChartOfCalculationTypesRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
