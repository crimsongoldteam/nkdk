import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { accountingExtDimensions } from "~/metadata/commonObjects/standardAttributeDescription/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { MetadataAccountingRegisterRules, MetadataAccountingRegisterStandardAttributeNames } from "./rules"
import { MetadataAccountingRegister } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")
const standardAttributeDescriptionFixturesUrl = new URL(
  "../../commonObjects/standardAttributeDescription/fromXML.test.ts",
  import.meta.url
).href

describe("import MetadataAccountingRegister from XML", () => {
  it("defines standard ExtDimension attributes up to 50", () => {
    expect(MetadataAccountingRegisterStandardAttributeNames.ExtDimension1).toBe("Субконто1")
    expect(MetadataAccountingRegisterStandardAttributeNames.ExtDimensionType1).toBe("ВидСубконто1")
    expect(MetadataAccountingRegisterStandardAttributeNames.ExtDimension50).toBe("Субконто50")
    expect(MetadataAccountingRegisterStandardAttributeNames.ExtDimensionType50).toBe("ВидСубконто50")
  })

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

  it("imports explicitly present empty ExtDimension attributes with accounting standard names", () => {
    const rule = {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: MetadataAccountingRegisterStandardAttributeNames,
    } satisfies PropertyRule

    const result = testImportPropertyFromXML({
      rule,
      path: "accounting-ext-dimensions.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: standardAttributeDescriptionFixturesUrl,
    })

    expect(result).toEqual(accountingExtDimensions)
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
