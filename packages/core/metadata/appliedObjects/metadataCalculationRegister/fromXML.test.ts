import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataCalculationRegisterRules } from "./rules"
import { MetadataCalculationRegister } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataCalculationRegister from XML", () => {
  it("imports calculation register fields and recalculations", () => {
    const result = testImportAppliedObjectFromXML<MetadataCalculationRegister>({
      rule: MetadataCalculationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(result?.itemType).toBe("MetadataCalculationRegister")
    expect(result?.periodicity).toBe("Quarter")
    expect(result?.actionPeriod).toBe(true)
    expect(result?.basePeriod).toBe(true)
    expect(result?.chartOfCalculationTypes).toBe("ChartOfCalculationTypes.ПланРасчетаВсеСвойства")
    expect(result?.recalculations?.map(({ name }: { name: string }) => name)).toEqual([
      "ПерерасчетВсеСвойства",
      "ПерерасчетПоУмолчанию",
    ])
    expect(result?.dimensions?.map(({ name }: { name: string }) => name)).toEqual([
      "ИзмерениеВсеСвойства",
      "ИспользоватьХранилищеДвоичныхДанных",
      "ИзмерениеПоУмолчанию",
    ])
  })

  it.each(["full.xml", "minimal.xml"])("round-trip: %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataCalculationRegister>({
      rule: MetadataCalculationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataCalculationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
