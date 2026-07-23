import { describe, expect, it } from "vitest"

import { serializeDirectXML, testPropertyFixtureThroughYAML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import { mockContextToXML } from "../../../tests/mockContext"
import type { MetadataItemRule } from "../../orchestration/property/types"

import "./register"

const rule = {
  itemType: "MetadataRegisterResourcesProbe",
  properties: { value: { type: "MetadataRegisterResources", yaml: "Значение", xml: "Resource" } },
} as MetadataItemRule

describe("MetadataRegisterResources YAML → XML", () => {
  it("round-trips register resources", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataRegisterResources",
      xmlRootTag: "Resource",
      importMetaUrl: import.meta.url,
      fixture: "resources.xml",
    })
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("preserves reference empty Synonym when current synonym is generated from name", () => {
    const referenceXML = {
      Resource: {
        Properties: {
          Name: "Содержание",
          Synonym: "",
          Type: { "v8:Type": "xs:string", "v8:StringQualifiers": { "v8:Length": 100, "v8:AllowedLength": "Variable" } },
        },
      },
    }
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: { Значение: { Содержание: { Тип: "Строка(100)" } } },
      referenceXML,
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
      rule,
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
})

const normalize = (value: string): string => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
