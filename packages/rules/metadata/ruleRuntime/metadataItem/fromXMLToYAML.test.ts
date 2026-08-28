import { describe, expect, it } from "vitest"
import "../../../tests/metadataExecutionContext"
import { mockContextFromXML, mockXmlImportContext } from "../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { registerMetadataItemCollectionRule } from "../metadataCollection/ruleFactory"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import { PropertyRuleType } from "../property/registry"
import { registerTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule } from "../property/types"
import { importMetadataItemFromXMLToYAML } from "./fromXMLToYAML"
import { registerMetadataItemRule } from "./ruleFactory"
import { registerMetadataItemXmlImportAugmenter } from "./augmenterRegistry"
import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
  serializeYAMLDocument,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import { withOperationRegistrySet } from "../../operations/operationExecutionContext"
import { createPropertyStateCapabilityRegistry, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import type { PropertyStateCapabilityContribution } from "../definition"
import {
  captureTestXmlImport,
  createFailingXmlImportAttempt,
  expectXmlImportInfrastructureFailure,
  xmlImportAttemptPhases,
} from "../../../tests/xmlImportAttempt"

describe("importMetadataItemFromXMLToYAML", () => {
  it("передаёт локальный вариант объекта вложенным правилам без утечки между соседями", () => {
    const observed: [string, "full" | "adopted" | undefined][] = []
    const observationType = "TestCurrentXMLDefaultVariant" as PropertyRuleType
    registerTypeRule(observationType, "importFromXML", (context, _rule, value) => {
      observed.push([String(value), context.fromXML.currentXMLDefaultVariant])
      return value
    })
    registerMetadataItemXmlImportAugmenter("test-current-xml-default-variant", {
      resolveCurrentXMLDefaultVariant: ({ rule }) => {
        if (rule.itemType === "TestVariantParent") return "full"
        if (rule.itemType === "TestVariantAdoptedChild") return "adopted"
        return undefined
      },
      augment() {},
    })
    const nestedRules = [
      ["TestVariantInheritedChild", "TestVariantInheritedChildType"],
      ["TestVariantAdoptedChild", "TestVariantAdoptedChildType"],
      ["TestVariantSibling", "TestVariantSiblingType"],
    ] as const
    for (const [itemType, propertyType] of nestedRules) {
      registerMetadataItemRule({
        propertyType: propertyType as PropertyRuleType,
        itemRule: {
          itemType,
          properties: {
            probe: { type: observationType, xml: "Probe", yaml: "Проверка" },
          },
        } as MetadataItemRule,
      })
    }
    const rule = {
      itemType: "TestVariantParent",
      properties: {
        probe: { type: observationType, xml: "Probe", yaml: "Проверка" },
        inherited: {
          type: "TestVariantInheritedChildType" as PropertyRuleType,
          xml: "Inherited",
          yaml: "Унаследованный",
        },
        adopted: {
          type: "TestVariantAdoptedChildType" as PropertyRuleType,
          xml: "Adopted",
          yaml: "Заимствованный",
        },
        sibling: {
          type: "TestVariantSiblingType" as PropertyRuleType,
          xml: "Sibling",
          yaml: "Соседний",
        },
      },
    } as MetadataItemRule
    const baseContext = mockContextFromXML()
    const context = {
      ...baseContext,
      fromXML: {
        ...baseContext.fromXML,
        metadataItemAugmenter: "test-current-xml-default-variant",
      },
    }

    importMetadataItemFromXMLToYAML({
      context,
      rule,
      xml: {
        Probe: "Parent",
        Inherited: { Probe: "InheritedChild" },
        Adopted: { Probe: "AdoptedChild" },
        Sibling: { Probe: "Sibling" },
      },
      traversal: {
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      },
    })

    expect(observed).toEqual([
      ["Parent", "full"],
      ["InheritedChild", "full"],
      ["AdoptedChild", "adopted"],
      ["Sibling", "full"],
    ])
    expect(context.fromXML.currentXMLDefaultVariant).toBeUndefined()
  })

  it("проецирует неизвестный XML-путь на ближайший metadata-item", () => {
    const rule = {
      itemType: "TestUnknownPathOwner",
      properties: {
        known: {
          type: "string",
          xml: "Known",
          yaml: "Известное",
          xmlParents: ["Properties"],
        },
      },
    } as MetadataItemRule
    const { yaml, annotations } = importAuditedMetadataItem(rule,
      '<Root><Properties><Known>yes</Known><Future mode="x">42</Future></Properties></Root>',
    )

    expect(yaml).toMatchObject({
      Известное: "yes",
      "Properties\\Future": undefined,
    })
    expect(annotations.at(yaml, "Properties\\Future")).toMatchObject({
      kind: "raw",
      xml: { _mode: "x", "#text": "42" },
      hasSemanticValue: false,
    })
    expect(yaml).toHaveProperty("Properties", undefined)
    expect(annotations.at(yaml, "Properties")).toMatchObject({
      kind: "raw",
      xml: { "#order": ["Known", "Future"] },
      hasSemanticValue: false,
    })
    expect(yaml).not.toHaveProperty("Properties\\Future\\#attributes")
    expect(serializeYAMLDocument(yaml, annotations).text).toContain(
      "Properties\\Future: !xml/raw",
    )
  })

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

  it("поднимает mixed text nested object к родительской property boundary", () => {
    const childType = "TestNestedRawOwner" as PropertyRuleType
    registerMetadataItemRule({
      propertyType: childType,
      itemRule: {
        itemType: "TestNestedRawItem",
        properties: {
          known: { type: "string", xml: "Known", yaml: "Известное" },
        },
      } as MetadataItemRule,
    })
    const rule = {
      itemType: "TestNestedRawParent",
      properties: {
        child: { type: childType, xml: "Child", yaml: "Дочерний" },
        sibling: { type: "string", xml: "Sibling", yaml: "Сосед" },
      },
    } as MetadataItemRule
    const { yaml, annotations } = importAuditedMetadataItem(rule,
      "<Root><Child>before<Known>yes</Known>after</Child><Sibling>keep</Sibling></Root>",
    )

    expect(yaml).toEqual({
      Дочерний: { Известное: "yes" },
      Сосед: "keep",
    })
    expect(annotations.at(yaml, "Дочерний")).toMatchObject({
      kind: "raw",
      hasSemanticValue: true,
    })
    const serialized = serializeYAMLDocument(yaml, annotations).text
    expect(serialized.match(/!xml\/raw/g)).toHaveLength(1)
    expect(serialized).toContain("Известное: yes")
    expect(serialized).toContain("Сосед: keep")
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

  it("протягивает XML-node и audit в nested metadata-item", () => {
    const failedType = "TestNestedItemFailure" as PropertyRuleType
    const itemType = "TestAuditedNestedItem" as PropertyRuleType
    registerTypeRule(failedType, "importFromXMLToYAML", () => {
      throw new Error("broken nested item")
    })
    registerMetadataItemRule({
      propertyType: itemType,
      itemRule: {
        itemType: "TestAuditedNestedItem",
        properties: {
          broken: { type: failedType, xml: "Broken", yaml: "Сломано" },
          good: { type: "string", xml: "Good", yaml: "Хорошо" },
        },
      } as MetadataItemRule,
    })
    const collector = createLocalIndexesCollector()
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const root = parseXmlDocumentWithSaxes(
      "<Root><Child><Broken>x</Broken><Good>ok</Good><Unknown>u</Unknown></Child></Root>",
    ).roots[0]!
    const audit = createXmlImportAuditSession([root])

    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "TestNestedItemOwner",
        properties: {
          child: { type: itemType, xml: "Child", yaml: "Дочерний" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: root }],
      yamlPath: [],
      rulePath: [],
      collector,
      audit,
    })
    audit.finalize()

    expect(yaml).toEqual({ Дочерний: { Хорошо: "ok" } })
    expect(audit.rawCandidates()).toMatchObject([
      {
        node: { path: "/Root[1]/Child[1]/Broken[1]" },
        boundary: {
          itemType: "TestAuditedNestedItem",
          propertyKey: "broken",
          yamlPath: ["Дочерний", "Сломано"],
        },
      },
    ])
    expect(
      audit.outcomes().find(({ node }) => node.path === "/Root[1]/Child[1]/Unknown[1]")?.state,
    ).toBe("unknown")
    expect(
      audit.outcomes().find(({ node }) => node.path === "/Root[1]/Child[1]")?.state,
    ).toBe("claimed")
  })

  it.each(xmlImportAttemptPhases)("пробрасывает фазу %s через nested metadata-item без raw", (phase) => {
    const valueType = `TestNestedItemInfrastructureValue${phase}` as PropertyRuleType
    const itemType = `TestNestedItemInfrastructure${phase}` as PropertyRuleType
    if (phase === "rollback") {
      registerTypeRule(valueType, "importFromXMLToYAML", () => {
        throw new Error("nested conversion failed")
      })
    }
    registerMetadataItemRule({
      propertyType: itemType,
      itemRule: {
        itemType: `TestNestedInfrastructureItem${phase}`,
        properties: {
          value: {
            type: phase === "rollback" ? valueType : "string",
            xml: "Value",
            yaml: "Значение",
          },
        },
      } as MetadataItemRule,
    })
    const { collector, cause } = createFailingXmlImportAttempt({
      phase,
      causeMessage: `${phase} nested item infrastructure failed`,
      targetAttempt: 2,
    })
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const root = parseXmlDocumentWithSaxes(
      "<Root><Child><Value>value</Value></Child></Root>",
    ).roots[0]!
    const audit = createXmlImportAuditSession([root])

    const thrown = captureTestXmlImport({
      context,
      xml: root,
      rule: {
        itemType: `TestNestedInfrastructureOwner${phase}`,
        properties: {
          child: { type: itemType, xml: "Child", yaml: "Дочерний" },
        },
      } as MetadataItemRule,
      collector,
      audit,
    })

    expectXmlImportInfrastructureFailure({ thrown, phase, cause, audit })
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

function importAuditedMetadataItem(
  rule: MetadataItemRule,
  xml: string,
): {
  yaml: Record<string, unknown>
  annotations: ReturnType<typeof createXmlAnomalyAnnotations>
} {
  const root = parseXmlDocumentWithSaxes(xml).roots[0]!
  const audit = createXmlImportAuditSession([root])
  const annotations = createXmlAnomalyAnnotations()
  const yaml = importMetadataItemFromXMLToYAML({
    context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
    rule,
    xml: root,
    traversal: {
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
      audit,
      annotations,
    },
  }) as Record<string, unknown>
  return { yaml, annotations }
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
    fromXML: {
      ...baseContext.fromXML,
      metadataItemAugmenter: "configurationExtension",
      currentXMLDefaultVariant: "adopted" as const,
    },
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
