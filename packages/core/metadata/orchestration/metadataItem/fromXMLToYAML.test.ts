import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockXmlImportContext } from "../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { registerMetadataItemCollectionRule } from "../metadataCollection/ruleFactory"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import { PropertyRuleType } from "../property/registry"
import { registerTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule } from "../property/types"
import { importMetadataItemFromXMLToYAML } from "./fromXMLToYAML"
import { registerMetadataItemRule } from "./ruleFactory"

describe("importMetadataItemFromXMLToYAML", () => {
  it("builds a nested item without returning its model shape", () => {
    const childRule = {
      itemType: "TestChild",
      properties: {
        name: { type: "string", xml: "Name", yaml: "Имя" },
        enabled: { type: "boolean", xml: "Enabled", yaml: "Включено" },
      },
    } as MetadataItemRule
    registerMetadataItemRule({ propertyType: "TestChild" as PropertyRuleType, itemRule: childRule })
    registerTypeRule("TestChild" as PropertyRuleType, "importFromXML", () => {
      throw new Error("legacy import must not run")
    })

    const result = runDirectRule(
      { itemType: "TestOwner", properties: { child: { type: "TestChild", xml: "Child", yaml: "Дочерний" } } },
      { Child: { Name: "A", Enabled: true } }
    )

    expect(result.yaml).toEqual({ Дочерний: { Имя: "A", Включено: "Истина" } })
    expect(result.yaml).not.toHaveProperty("child")
  })

  it("returns the inline YAML property without its service wrapper", () => {
    const inlineRule = {
      itemType: "TestInline",
      properties: {
        items: { type: "string", xml: "Value", yaml: "items", yamlInline: true },
      },
    } as MetadataItemRule
    registerMetadataItemRule({ propertyType: "TestInline" as PropertyRuleType, itemRule: inlineRule })

    const result = runDirectRule(
      { itemType: "TestOwner", properties: { inline: { type: "TestInline", xml: "Inline", yaml: "Значение" } } },
      { Inline: { Value: "payload" } }
    )

    expect(result.yaml).toEqual({ Значение: "payload" })
  })

  it("добавляет Контроль корневого metadata-item до возврата YAML", () => {
    const rule = {
      itemType: "Task4RootNotify",
      properties: {
        defaultRunMode: {
          type: "string",
          xml: "DefaultRunMode",
          yaml: "ОсновнойРежимЗапуска",
          xmlParents: ["Properties"],
        },
      },
    } as MetadataItemRule

    const yaml = runMetadataItemRule(rule, {
      Properties: { DefaultRunMode: "ManagedApplication" },
      InternalInfo: {
        "xr:PropertyState": {
          "xr:Property": "DefaultRunMode",
          "xr:State": "Notify",
        },
      },
    })

    expect(yaml).toEqual({
      ОсновнойРежимЗапуска: "ManagedApplication",
      Контроль: ["ОсновнойРежимЗапуска"],
    })
  })

  it("рекурсивно добавляет Контроль вложенному metadata-item коллекции", () => {
    const attributeRule = {
      itemType: "Task4NestedAttribute",
      properties: {
        name: { type: "string", xml: "Name", yaml: "Имя", xmlParents: ["Properties"] },
        type: { type: "string", xml: "Type", yaml: "Тип", xmlParents: ["Properties"] },
        format: { type: "string", xml: "Format", yaml: "Формат", xmlParents: ["Properties"] },
      },
    } as MetadataItemRule
    registerMetadataItemCollectionRule({
      propertyType: "Task4NestedAttributes" as PropertyRuleType,
      itemRule: attributeRule,
      xmlElement: "Attribute",
      keyField: "name",
    })
    const ownerRule = {
      itemType: "Task4NestedOwner",
      properties: {
        attributes: {
          type: "Task4NestedAttributes",
          xml: "Attribute",
          yaml: "Реквизиты",
          xmlParents: ["ChildObjects"],
        },
      },
    } as MetadataItemRule

    const yaml = runMetadataItemRule(ownerRule, {
      ChildObjects: {
        Attribute: {
          Properties: {
            Name: "РеквизитСправочника",
            Type: "Дата",
            Format: "ffff",
          },
          InternalInfo: {
            "xr:PropertyState": [
              {
                "xr:Property": "ExtendedConfigurationObject",
                "xr:State": "Notify",
              },
              {
                "xr:Property": "Format",
                "xr:State": "Notify",
              },
            ],
          },
        },
      },
    })

    expect(yaml).toMatchObject({
      Реквизиты: {
        РеквизитСправочника: {
          Тип: "Дата",
          Формат: "ffff",
          Контроль: ["ОбъектРасширяемойКонфигурации", "Формат"],
        },
      },
    })
  })
})

function runDirectRule(rule: MetadataItemRule, xml: Record<string, unknown>) {
  const collector = createLocalIndexesCollector()
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
  const yaml = importPropertiesFromXMLToYAML({
    context,
    rule,
    sources: [{ context, xml }],
    yamlPath: [],
    rulePath: [],
    collector,
  })
  return { yaml, localIndexes: collector.finish() }
}

function runMetadataItemRule(rule: MetadataItemRule, xml: Record<string, unknown>) {
  const collector = createLocalIndexesCollector()
  const baseContext = mockXmlImportContext()
  const extensionContext = {
    ...baseContext,
    exportToYAML: { toTyped: true },
    fromXML: { ...baseContext.fromXML, metadataItemAugmenter: "configurationExtension" },
  }
  return importMetadataItemFromXMLToYAML({
    context: extensionContext,
    rule,
    xml,
    traversal: { yamlPath: [], rulePath: [], collector },
  })
}
