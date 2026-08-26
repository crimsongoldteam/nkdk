import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
  projectXmlAuditRemainder,
} from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { createRuleRegistrySet, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { PropertyRule } from "../../../ruleRuntime"
import { metadataRules } from "../../../composition/metadataRules"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { testPropertyFromXMLToYAML } from "../../../../tests/directConversion"
import { settingsParameterValueCollectionFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "SettingsParameterValueCollection",
  defaultItemRule: {
    type: "SettingsParameterValue",
    valueType: "Field",
  },
}

describe("import SettingsParameterValueCollection from XML", () => {
  it("imports full fixture", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:dataParameters",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(settingsParameterValueCollectionFixture)
  })

  it("imports ent system enumeration values under generic Field rule", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:dataParameters",
      xmlString: `<dcsset:dataParameters xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise/current-config">
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:use>false</dcscor:use>
    <dcscor:parameter>ВидДвижения</dcscor:parameter>
    <dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>
  </dcscor:item>
</dcsset:dataParameters>`,
    })

    expect(result).toEqual({
      itemType: "SettingsParameterValueCollection",
      parameters: {
        ВидДвижения: {
          parameter: "ВидДвижения",
          use: false,
          value: {
            type: "SystemEnumeration",
            typeSE: "AccumulationRecordType",
            value: "Receipt",
          },
        },
      },
    })
  })

  it("imports xsi:nil as the local Nil transport", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:dataParameters",
      xmlString: `<dcsset:dataParameters>
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:parameter>Параметр1</dcscor:parameter>
    <dcscor:value xsi:nil="true"/>
  </dcscor:item>
</dcsset:dataParameters>`,
    })

    expect(result).toMatchObject({ parameters: { Параметр1: { xmlNil: true } } })
  })

  it("структурно импортирует все повторяющиеся dcscor:item без raw-остатка", () => {
    const registries = createRuleRegistrySet(metadataRules)
    expect(registries.property.getTypeRule(
      "SettingsParameterValueCollection",
      "xmlImportPropertyBehavior",
    ))
      .toEqual({ repeatedXMLNodes: true })
    const document = parseXmlDocumentWithSaxes(`<Root>
      <dcssch:inputParameters>
        <dcscor:item><dcscor:parameter>Первый</dcscor:parameter><dcscor:value xsi:type="dcscor:Field">Поле1</dcscor:value></dcscor:item>
        <dcscor:item><dcscor:parameter>Второй</dcscor:parameter><dcscor:value xsi:type="dcscor:Field">Поле2</dcscor:value></dcscor:item>
      </dcssch:inputParameters>
    </Root>`)
    const root = document.roots[0]!
    const audit = createXmlImportAuditSession([root])
    const annotations = createXmlAnomalyAnnotations()
    const ownerRule = {
      itemType: "SettingsParameterValueCollectionProbe",
      properties: {
        values: {
          ...rule,
          xml: "dcscor:item",
          xmlParents: ["dcssch:inputParameters"],
          yaml: "Значения",
        },
      },
    } as MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      rule: ownerRule,
      xml: root,
      audit,
      annotations,
      execution: registries.execution,
    }).yaml as Record<string, unknown>
    audit.finalize()

    projectXmlAuditRemainder({
      yaml: imported,
      annotations,
      audit,
      root,
      boundary: { itemType: ownerRule.itemType, yamlPath: [], rulePath: [] },
    })

    expect(imported).toMatchObject({
      Значения: {
        Первый: { Значение: "Поле1" },
        Второй: { Значение: "Поле2" },
      },
    })
    expect([...annotations.entries()]).toEqual([])
  })
})
