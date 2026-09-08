import { ExecutionPath } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  markXmlAnomalyExportClaim,
  parseXmlDocumentWithSaxes,
  readXmlAnomalyExportClaim,
  yamlScalarTagAt,
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
import { createRuleRegistrySet, withRuleRegistrySet } from "../ruleRegistrySet"
import { metadataRules } from "../../composition/metadataRules"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import {
  importFormElementPropertiesFromXMLToYAML,
  importSingleFormElementFromXMLToYAML,
} from "./fromXMLToYAML"
import type { ElementXML } from "./types"
import { createDirectImportFactsCollector, prepareFormElementOutput } from "@nkdk/runtime/rule-kit"

import "../../forms/elements/index"

const singletonElementContexts = () => createDirectRoundTripContexts({
  logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента.Элемент.Кнопка",
  targetProjectPath: "Форма.yaml",
})

const singletonElementProbeRule = {
  itemType: "SingletonElementProbe",
  properties: {
    tooltip: {
      type: "ExtendedTooltip",
      xml: "ExtendedTooltip",
      yaml: "РасширеннаяПодсказка",
    },
  },
} as const satisfies MetadataItemRule

describe("одиночный элемент формы", () => {
  it("в первом проходе сохраняет факты singleton без второй копии его свойств", () => {
    const registries = createRuleRegistrySet(metadataRules)
    const rule = withRuleRegistrySet(registries, () => getElementRule("ExtendedTooltip"))
    const xml = parseXmlDocumentWithSaxes('<ExtendedTooltip name="ОсобаяПодсказка" id="2"><Width>20</Width></ExtendedTooltip>').roots[0]!
    const facts = createDirectImportFactsCollector()
    const yaml = importSingleFormElementFromXMLToYAML({
      context: singletonElementContexts().importContext,
      rule, xml, ownerXmlName: "Кнопка",
      nameStyle: { canonicalSuffix: "РасширеннаяПодсказка", referenceSuffixes: ["РасширеннаяПодсказка"], canonicalNameMode: "ownerSuffix", explicitXMLName: true },
      traversal: {
        mode: "facts", produceResult: true, facts,
        pathCursor: ExecutionPath.from<string | number>([]), rulePath: [], collector: createLocalIndexesCollector(), execution: registries.execution,
      },
    })

    expect(yaml).toEqual({ Имя: "ОсобаяПодсказка" })
    expect(yamlScalarTagAt(yaml, "Имя")).toBe("xml/name")
    expect(facts.finish()).toContainEqual(expect.objectContaining({ yamlPath: ["Ширина"], value: 20 }))
  })

  it.each([false, true])("готовит явное имя singleton до открытия локальной проверки; структурный XML: %s", (structural) => {
    const registries = createRuleRegistrySet(metadataRules)
    const rule = withRuleRegistrySet(registries, () => getElementRule("ExtendedTooltip"))
    const xml = structural
      ? parseXmlDocumentWithSaxes('<ExtendedTooltip name="ОсобаяПодсказка" id="2"><Width>20</Width></ExtendedTooltip>').roots[0]!
      : { _name: "ОсобаяПодсказка", _id: "2", Width: "20" }
    if (structural) Object.defineProperty(xml, "compatibilityValue", { get() { throw new Error("Одиночному элементу не нужна копия") } })
    let opened: Record<string, unknown> | undefined
    const yaml = importSingleFormElementFromXMLToYAML({
      context: singletonElementContexts().importContext,
      rule, xml, ownerXmlName: "Кнопка",
      nameStyle: { canonicalSuffix: "РасширеннаяПодсказка", referenceSuffixes: ["РасширеннаяПодсказка"], canonicalNameMode: "ownerSuffix", explicitXMLName: true },
      traversal: {
        pathCursor: ExecutionPath.from<string | number>([]), rulePath: [], collector: createLocalIndexesCollector(), execution: registries.execution,
        roundTrip: { open({ yaml }) {
          opened = yaml
          expect(yaml.Имя).toBe("ОсобаяПодсказка")
          expect(yamlScalarTagAt(yaml, "Имя")).toBe("xml/name")
          return { ready() {}, finish() {
            expect(yaml.Имя).toBe("ОсобаяПодсказка")
            expect(Object.keys(yaml)).toEqual(["Ширина", "Имя"])
            Object.freeze(yaml)
          } }
        } },
      },
    })
    expect(yaml).toBe(opened)
    expect(yaml).toEqual({ Ширина: 20, Имя: "ОсобаяПодсказка" })
  })

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
        pathCursor: ExecutionPath.from<string | number>([]),
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
    const registries = createRuleRegistrySet(metadataRules)
    const registeredRule = withRuleRegistrySet(registries, () => getElementRule("ExtendedTooltip"))
    const elementRule = {
      itemType: "ExtendedTooltip",
      enterpriseField: "FormDecoration",
      enterpriseFieldType: "None",
      properties: {},
    } as const satisfies ElementRule

    const definition = defineElementRule("ExtendedTooltip", elementRule)

    expect(withRuleRegistrySet(registries, () => getElementRule("ExtendedTooltip"))).toBe(registeredRule)
    expect(definition.formElements.ExtendedTooltip).toBe(elementRule)
  })

  it.each([false, true])("восстанавливает имя и id перед остальными XML-атрибутами; структурный XML: %s", (structural) => {
    const contexts = singletonElementContexts()
    const source = {
      ExtendedTooltip: {
        _name: "КнопкаРасширеннаяПодсказка",
        _id: "2",
        _DisplayImportance: "VeryHigh",
      },
    }

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: singletonElementProbeRule,
      xml: structural
        ? parseXmlDocumentWithSaxes('<Root><ExtendedTooltip name="КнопкаРасширеннаяПодсказка" id="2" DisplayImportance="VeryHigh"/></Root>').roots[0]!
        : source,
      name: "Кнопка",
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule: singletonElementProbeRule,
      yaml: imported.yaml,
      name: "Кнопка",
    })

    expect(Object.keys(exported.xml.ExtendedTooltip as Record<string, unknown>)).toEqual([
      "_name",
      "_id",
      "_DisplayImportance",
    ])
    expect(exported.xml.ExtendedTooltip).toMatchObject({ _name: "КнопкаРасширеннаяПодсказка", _id: "2" })
  })

  it("сохраняет export claim одиночного элемента при добавлении имени и id", () => {
    const contexts = singletonElementContexts()
    const tooltip = {}
    markXmlAnomalyExportClaim(tooltip, "item-1")

    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule: singletonElementProbeRule,
      yaml: { РасширеннаяПодсказка: tooltip },
      name: "Кнопка",
    })

    expect(readXmlAnomalyExportClaim(exported.xml.ExtendedTooltip)).toBe("item-1")
  })

  it("оборачивает готовый элемент коллекции без чтения его XML и потери claim", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента.Элемент.Кнопка",
      targetProjectPath: "Форма.yaml",
    })
    const elementRule = {
      itemType: "Button",
      enterpriseField: "FormButton",
      enterpriseFieldType: "FormButtonType.UsualButton",
      properties: {},
    } as const satisfies ElementRule
    const xml = new Proxy({}, { ownKeys() { throw new Error("Нельзя обходить готового ребёнка") } })
    markXmlAnomalyExportClaim(xml, "item-2")

    const preparation = prepareFormElementOutput({
      context: contexts.exportContext(),
      yaml: { Вид: "Кнопка" },
      name: "Кнопка",
      itemRule: elementRule,
      propertyRule: undefined,
    })
    const mapped = preparation.wrap!(xml) as Record<string, unknown>

    expect(readXmlAnomalyExportClaim(mapped.Button)).toBe("item-2")
    expect(mapped.Button).toBe(xml)
  })
})
