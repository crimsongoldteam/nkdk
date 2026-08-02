import { describe, expect, it } from "vitest"

import { serializeDirectXML, testPropertyFixtureThroughYAML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import { mockContextToXML } from "../../../tests/mockContext"
import type { MetadataItemRule } from "../../orchestration/property/types"

import { MetadataInformationRegisterDimensionRules } from "../../appliedObjects/metadataInformationRegister/childRules"

const rule = {
  itemType: "MetadataInformationRegisterDimensionsProbe",
  properties: {
    value: {
      type: "MetadataInformationRegisterDimensions",
      yaml: "Значение",
      xml: "Dimension",
      itemRule: MetadataInformationRegisterDimensionRules,
    },
  },
} as MetadataItemRule

describe("MetadataInformationRegisterDimensions YAML → XML", () => {
  it("round-trips register dimensions", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataInformationRegisterDimensions",
      itemRule: MetadataInformationRegisterDimensionRules,
      xmlRootTag: "Dimension",
      importMetaUrl: import.meta.url,
      fixture: "dimensions.xml",
    })
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("exports explicit empty YAML synonym", () => {
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: { Значение: { Организация: { Синоним: "", Тип: "Булево" } } },
    })
    const xml = serializeDirectXML(result.xml)
    expect(xml).toContain("<Synonym/>")
    expect(xml).not.toContain("<v8:item>")
  })

  it("exports accounting fields before common tail without reference", () => {
    const context = mockContextToXML()
    context.exportToXML.itemsTree.push({
      itemType: "MetadataAccountingRegister",
      name: "РегистрБухгалтерииВсеСвойстваОбороты",
      path: "MetadataAccountingRegister.РегистрБухгалтерииВсеСвойстваОбороты",
    })
    const result = testPropertyFromYAMLToXML({
      context,
      rule,
      yaml: {
        Значение: {
          ИзмерениеВсеСвойства: {
            Тип: "Булево",
            ИсторияВыбораПриВводе: "НеИспользовать",
            Балансовый: "Ложь",
            ПризнакУчета: "ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаВсеСвойства",
            ЗапретНезавершенныхЗначений: "Ложь",
            Индексирование: "НеИндексировать",
            ПолнотекстовыйПоиск: "НеИспользовать",
          },
        },
      },
    })
    expect(serializeDirectXML(result.xml)).toMatch(
      /<ChoiceHistoryOnInput>DontUse<\/ChoiceHistoryOnInput>[\s\S]*<Balance>false<\/Balance>[\s\S]*<AccountingFlag>ChartOfAccounts\.ПланСчетовВсеСвойства\.AccountingFlag\.ПризнакУчетаВсеСвойства<\/AccountingFlag>[\s\S]*<DenyIncompleteValues>false<\/DenyIncompleteValues>[\s\S]*<Indexing>DontIndex<\/Indexing>[\s\S]*<FullTextSearch>DontUse<\/FullTextSearch>/
    )
  })
})

const normalize = (value: string): string => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
