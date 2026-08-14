import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockXmlImportContext } from "../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { registerMetadataItemCollectionRule } from "../metadataCollection/ruleFactory"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import { PropertyRuleType } from "../property/registry"
import { registerTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule } from "../property/types"
import { importMetadataItemFromXMLToYAML } from "./fromXMLToYAML"
import { registerMetadataItemRule } from "./ruleFactory"
import { yamlScalarTagAt } from "@nkdk/runtime"
import { withOperationRegistrySet } from "../../operations/operationExecutionContext"
import { createPropertyStateCapabilityRegistry, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import type { PropertyStateCapabilityContribution } from "../definition"

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

  it("добавляет !проверять корневому metadata-item до возврата YAML", () => {
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
    }, [definePropertyStateItemCapabilities(rule, {
      properties: {
        defaultRunMode: { availability: "borrowed", modes: ["control", "notify"], representation: "tagged" },
      },
    })])

    expect(yaml).toEqual({ ОсновнойРежимЗапуска: "ManagedApplication" })
    expect(yamlScalarTagAt(yaml, "ОсновнойРежимЗапуска")).toBe("проверять")
  })

  it("рекурсивно добавляет теги вложенному metadata-item коллекции", () => {
    const attributeRule = {
      itemType: "Task4NestedAttribute",
      properties: {
        uuid: { type: "UUID", xml: "_uuid", forReferenceOnly: true },
        name: { type: "string", xml: "Name", yaml: "Имя", xmlParents: ["Properties"] },
        type: { type: "string", xml: "Type", yaml: "Тип", xmlParents: ["Properties"] },
        format: { type: "string", xml: "Format", yaml: "Формат", xmlParents: ["Properties"] },
        extendedConfigurationObject: { type: "string", runtimeOnly: true, xmlParents: ["Properties"] },
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
            ObjectBelonging: "Adopted",
            Name: "РеквизитСправочника",
            Type: "Дата",
            Format: "ffff",
            ExtendedConfigurationObject: "11111111-1111-4111-8111-111111111111",
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
    }, [definePropertyStateItemCapabilities(attributeRule, {
      properties: {
        extendedConfigurationObject: {
          availability: "borrowed",
          modes: ["control", "notify"],
          representation: "tagged",
        },
        format: { availability: "borrowed", modes: ["control", "notify"], representation: "tagged" },
      },
    })])

    expect(yaml).toMatchObject({
      Реквизиты: {
        РеквизитСправочника: {
          Тип: "Дата",
          Формат: "ffff",
          ОбъектРасширяемойКонфигурации: {},
        },
      },
    })
    const attribute = ((yaml as Record<string, unknown>).Реквизиты as Record<string, Record<string, unknown>>).РеквизитСправочника
    expect(yamlScalarTagAt(attribute, "ОбъектРасширяемойКонфигурации")).toBe("проверять")
    expect(yamlScalarTagAt(attribute, "Формат")).toBe("проверять")
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

function runMetadataItemRule(
  rule: MetadataItemRule,
  xml: Record<string, unknown>,
  contributions: readonly PropertyStateCapabilityContribution[],
) {
  const collector = createLocalIndexesCollector()
  const baseContext = mockXmlImportContext()
  const extensionContext = {
    ...baseContext,
    exportToYAML: { toTyped: true },
    fromXML: { ...baseContext.fromXML, metadataItemAugmenter: "configurationExtension" },
  }
  return withOperationRegistrySet({
    propertyStates: createPropertyStateCapabilityRegistry(contributions),
  }, () => importMetadataItemFromXMLToYAML({
      context: extensionContext,
      rule,
      xml,
      traversal: { yamlPath: [], rulePath: [], collector },
    }))
}
