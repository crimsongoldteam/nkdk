import { describe, expect, it } from "vitest"
import { dimensionsFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataRegisterDimensions", xml: "Dimension" } as const

describe("export MetadataRegisterDimensions to XML", () => {
  it("round-trips register dimensions", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: dimensionsFromXML,
      xmlRootTag: "Dimension",
      path: "dimensions.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves reference empty Synonym when current synonym is generated from name", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [
        {
          itemType: "MetadataRegisterDimension",
          name: "Организация",
          synonym: { items: { ru: "Организация" } },
          type: { type: ["boolean"] },
        },
      ],
      xmlRootTag: "Dimension",
      referenceMetadata: [
        {
          itemType: "MetadataRegisterDimension",
          name: "Организация",
          synonym: { items: {} },
          type: { type: ["boolean"] },
        },
      ],
    })

    expect(result).toContain("<Synonym/>")
    expect(result).not.toContain("<v8:item>")
  })

  it("exports accounting fields before common tail without reference", () => {
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
          itemType: "MetadataRegisterDimension",
          name: "ИзмерениеВсеСвойства",
          type: { type: ["boolean"] },
          choiceHistoryOnInput: "DontUse",
          balance: false,
          accountingFlag: "ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаВсеСвойства",
          denyIncompleteValues: false,
          indexing: "DontIndex",
          fullTextSearch: "DontUse",
        },
      ],
      xmlRootTag: "Dimension",
      referenceMetadata: undefined,
    })

    expect(result).toMatch(
      /<ChoiceHistoryOnInput>DontUse<\/ChoiceHistoryOnInput>[\s\S]*<Balance>false<\/Balance>[\s\S]*<AccountingFlag>ChartOfAccounts\.ПланСчетовВсеСвойства\.AccountingFlag\.ПризнакУчетаВсеСвойства<\/AccountingFlag>[\s\S]*<DenyIncompleteValues>false<\/DenyIncompleteValues>[\s\S]*<Indexing>DontIndex<\/Indexing>[\s\S]*<FullTextSearch>DontUse<\/FullTextSearch>/
    )
  })
})
