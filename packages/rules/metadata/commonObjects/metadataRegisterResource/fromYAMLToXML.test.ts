import { describe, expect, it } from "vitest"

import { serializeDirectXML, testPropertyFixtureThroughYAML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import { mockContextToXML } from "../../../tests/mockContext"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

import { MetadataInformationRegisterResourceRules } from "../../appliedObjects/metadataInformationRegister/childRules"
import { MetadataAccountingRegisterResourceRules } from "../../appliedObjects/metadataAccountingRegister/childRules"
import { accountingRegisterContext } from "../../../tests/accountingRegisterContext"

const rule = {
  itemType: "MetadataInformationRegisterResourcesProbe",
  properties: {
    value: {
      type: "MetadataInformationRegisterResources",
      yaml: "Значение",
      xml: "Resource",
      itemRule: MetadataInformationRegisterResourceRules,
    },
  },
} as MetadataItemRule
const accountingRule = {
  itemType: "MetadataAccountingRegisterResourcesProbe",
  properties: {
    value: {
      type: "MetadataAccountingRegisterResources",
      yaml: "Значение",
      xml: "Resource",
      itemRule: MetadataAccountingRegisterResourceRules,
    },
  },
} as MetadataItemRule

describe("MetadataInformationRegisterResources YAML → XML", () => {
  it("round-trips register resources", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataInformationRegisterResources",
      itemRule: MetadataInformationRegisterResourceRules,
      xmlRootTag: "Resource",
      importMetaUrl: import.meta.url,
      fixture: "resources.xml",
    })
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("exports explicit empty YAML synonym", () => {
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: { Значение: { Содержание: { Синоним: "", Тип: "Строка(100)" } } },
    })
    const xml = serializeDirectXML(result.xml)
    expect(xml).toContain("<Synonym/>")
    expect(xml).not.toContain("<v8:item>")
  })

  it("exports accounting fields before full text search without reference", () => {
    const context = mockContextToXML()
    context.exportToXML.itemsTree.push({
      itemType: "MetadataAccountingRegister",
      name: "РегистрБухгалтерииВсеСвойстваОбороты",
      path: "MetadataAccountingRegister.РегистрБухгалтерииВсеСвойстваОбороты",
    })
    const result = testPropertyFromYAMLToXML({
      context,
      rule: accountingRule,
      yaml: {
        Значение: {
          РесурсВсеСвойства: {
            Тип: "Число(10, 0)",
            ИсторияВыбораПриВводе: "НеИспользовать",
            Балансовый: "Истина",
            ПризнакУчета: "ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаВсеСвойства",
            ПризнакУчетаСубконто:
              "ChartOfAccounts.ПланСчетовВсеСвойства.ExtDimensionAccountingFlag.ПризнакУчетаСубконтоВсеСвойства",
            ПолнотекстовыйПоиск: "НеИспользовать",
          },
        },
      },
    })
    expect(serializeDirectXML(result.xml)).toMatch(
      /<ChoiceHistoryOnInput>DontUse<\/ChoiceHistoryOnInput>[\s\S]*<Balance>true<\/Balance>[\s\S]*<AccountingFlag>ChartOfAccounts\.ПланСчетовВсеСвойства\.AccountingFlag\.ПризнакУчетаВсеСвойства<\/AccountingFlag>[\s\S]*<ExtDimensionAccountingFlag>ChartOfAccounts\.ПланСчетовВсеСвойства\.ExtDimensionAccountingFlag\.ПризнакУчетаСубконтоВсеСвойства<\/ExtDimensionAccountingFlag>[\s\S]*<FullTextSearch>DontUse<\/FullTextSearch>/
    )
  })

  it.each(["full", "adopted"] as const)("выводит обязательный Balance в варианте %s", (variant) => {
    expect(exportAccountingResource(variant)).toContain("<Balance>true</Balance>")
  })
})

function exportAccountingResource(variant: "full" | "adopted"): string {
  const result = testPropertyFromYAMLToXML({
    context: accountingRegisterContext(variant),
    rule: accountingRule,
    yaml: { Значение: { Ресурс: { Тип: "Число(10, 0)" } } },
  })
  return serializeDirectXML(result.xml)
}

const normalize = (value: string): string => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
