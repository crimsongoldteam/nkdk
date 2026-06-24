import { describe, expect, it } from "vitest"
import { resourcesFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataRegisterResources", xml: "Resource" } as const

describe("export MetadataRegisterResources to XML", () => {
  it("round-trips register resources", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: resourcesFromXML,
      xmlRootTag: "Resource",
      path: "resources.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves reference empty Synonym when current synonym is generated from name", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [
        {
          itemType: "MetadataRegisterResource",
          name: "Содержание",
          synonym: { items: { ru: "Содержание" } },
          type: { type: ["string"], stringQualifiers: { length: 100, allowedLength: "Variable" } },
        },
      ],
      xmlRootTag: "Resource",
      referenceMetadata: [
        {
          itemType: "MetadataRegisterResource",
          name: "Содержание",
          synonym: { items: {} },
          type: { type: ["string"], stringQualifiers: { length: 100, allowedLength: "Variable" } },
        },
      ],
    })

    expect(result).toContain("<Synonym/>")
    expect(result).not.toContain("<v8:item>")
  })

  it("exports accounting fields before full text search without reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      itemsTree: [
        {
          itemType: "MetadataAccountingRegister",
          name: "РегистрБухгалтерииВсеСвойстваОбороты",
          path: "MetadataAccountingRegister.РегистрБухгалтерииВсеСвойстваОбороты",
        },
      ],
      value: [
        {
          itemType: "MetadataRegisterResource",
          name: "РесурсВсеСвойства",
          type: { type: ["decimal"], numberQualifiers: { digits: 10, fractionDigits: 0, allowedSign: "Any" } },
          choiceHistoryOnInput: "DontUse",
          balance: true,
          accountingFlag: "ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаВсеСвойства",
          extDimensionAccountingFlag:
            "ChartOfAccounts.ПланСчетовВсеСвойства.ExtDimensionAccountingFlag.ПризнакУчетаСубконтоВсеСвойства",
          fullTextSearch: "DontUse",
        },
      ],
      xmlRootTag: "Resource",
      referenceMetadata: undefined,
    })

    expect(result).toMatch(
      /<ChoiceHistoryOnInput>DontUse<\/ChoiceHistoryOnInput>[\s\S]*<Balance>true<\/Balance>[\s\S]*<AccountingFlag>ChartOfAccounts\.ПланСчетовВсеСвойства\.AccountingFlag\.ПризнакУчетаВсеСвойства<\/AccountingFlag>[\s\S]*<ExtDimensionAccountingFlag>ChartOfAccounts\.ПланСчетовВсеСвойства\.ExtDimensionAccountingFlag\.ПризнакУчетаСубконтоВсеСвойства<\/ExtDimensionAccountingFlag>[\s\S]*<FullTextSearch>DontUse<\/FullTextSearch>/
    )
  })
})
