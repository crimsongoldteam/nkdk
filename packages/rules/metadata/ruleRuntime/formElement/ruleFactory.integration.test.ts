import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
} from "@nkdk/runtime"
import { createImportedDependentPropertyCollector } from "../property/importYamlTypes"
import type { MetadataItemRule } from "../property/types"
import type { ElementRule } from "./types"
import {
  defineElementAsType,
  defineElementRule,
  getElementRule,
} from "./ruleFactory"
import { typeRulesRegistryRevision } from "../property/typeRuleRegistry"
import { createRuleRegistrySet } from "../ruleRegistrySet"
import { metadataRules } from "../../composition/metadataRules"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import {
  importFormElementPropertiesFromXMLToYAML,
  importSingleFormElementFromXMLToYAML,
} from "./fromXMLToYAML"
import type { ElementXML } from "./types"

import "../../forms/elements/index"

describe("одиночный элемент формы", () => {
  it.each(["обычный", "singleton"] as const)(
    "передаёт полный DirectImportTraversal во вложенные свойства: %s",
    (mode) => {
      const registries = createRuleRegistrySet(metadataRules)
      const root = parseXmlDocumentWithSaxes("<Element><Value>ok</Value></Element>").roots[0]!
      const valueNode = root.content.find((node) => node.type === "element")!
      const audit = createXmlImportAuditSession([root])
      const annotations = createXmlAnomalyAnnotations()
      const dependent = createImportedDependentPropertyCollector()
      const observed: unknown[] = []
      registries.property.registerTypeRule("TraversalProbe" as never, "importFromXMLToYAML", ({ traversal }) => {
        observed.push({
          audit: traversal.audit,
          annotations: traversal.annotations,
          dependent: traversal.dependent,
          xmlNodes: traversal.xmlNodes,
        })
        return "ok"
      })
      const rule = {
        itemType: "Button",
        enterpriseField: "FormButton",
        enterpriseFieldType: "FormButtonType.UsualButton",
        properties: {
          value: { type: "TraversalProbe", yaml: "Значение", xml: "Value" },
        },
      } as const satisfies ElementRule
      const traversal = {
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
        dependent,
        audit,
        annotations,
        xmlNodes: [root],
        execution: registries.execution,
      }

      if (mode === "обычный") {
        importFormElementPropertiesFromXMLToYAML({
          context: createDirectRoundTripContexts().importContext,
          rule,
          xml: root as unknown as ElementXML,
          name: "Элемент",
          traversal,
        })
      } else {
        importSingleFormElementFromXMLToYAML({
          context: createDirectRoundTripContexts().importContext,
          rule,
          xml: root as unknown as ElementXML,
          traversal,
        })
      }

      expect(observed).toEqual([{
        audit,
        annotations,
        dependent,
        xmlNodes: [valueNode],
      }])
    },
  )

  it("создаёт definition без записи в legacy registry", () => {
    const revision = typeRulesRegistryRevision()
    const elementRule = {
      itemType: "ExtendedTooltip",
      enterpriseField: "FormDecoration",
      enterpriseFieldType: "None",
      properties: {},
    } as const satisfies ElementRule

    const definition = defineElementAsType({
      propertyType: "TestPureFormElement",
      elementRule,
      toXML: () => ({ name: "Поле" }),
    })

    expect(typeRulesRegistryRevision()).toBe(revision)
    expect(
      definition.propertyTypes.TestPureFormElement?.importFromXMLToYAML,
    ).toBeTypeOf("function")
    expect(definition.formElements.ExtendedTooltip).toBe(elementRule)
  })

  it("определяет element rule без изменения legacy registry", () => {
    const registeredRule = getElementRule("ExtendedTooltip")
    const elementRule = {
      itemType: "ExtendedTooltip",
      enterpriseField: "FormDecoration",
      enterpriseFieldType: "None",
      properties: {},
    } as const satisfies ElementRule

    const definition = defineElementRule("ExtendedTooltip", elementRule)

    expect(getElementRule("ExtendedTooltip")).toBe(registeredRule)
    expect(definition.formElements.ExtendedTooltip).toBe(elementRule)
  })

  it("восстанавливает имя и id перед остальными XML-атрибутами без reference XML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента.Элемент.Кнопка",
      targetProjectPath: "Форма.yaml",
    })
    const rule = {
      itemType: "SingletonElementProbe",
      properties: {
        tooltip: {
          type: "ExtendedTooltip",
          xml: "ExtendedTooltip",
          yaml: "РасширеннаяПодсказка",
        },
      },
    } as const satisfies MetadataItemRule
    const source = {
      ExtendedTooltip: {
        _name: "КнопкаРасширеннаяПодсказка",
        _id: "2",
        _DisplayImportance: "VeryHigh",
      },
    }

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: source,
      name: "Кнопка",
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
      name: "Кнопка",
    })

    expect(Object.keys(exported.xml.ExtendedTooltip as Record<string, unknown>)).toEqual([
      "_name",
      "_id",
      "_DisplayImportance",
    ])
  })
})
