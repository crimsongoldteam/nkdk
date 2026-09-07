import {
  createXmlAnomalyAnnotations,
  parseXmlDocumentWithSaxes,
  parseMetadataYaml,
  serializeYAMLDocument,
  xmlExport,
  type XmlElementNode,
} from "@nkdk/runtime"
import { createRuleRegistrySet, convertMetadataItemFromYAMLToXML, convertPropertiesFromYAMLToXML, importMetadataItemFromXMLToYAML, importPropertiesFromXMLToYAML, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { metadataRules } from "../composition/metadataRules"
import { mockContextFromXML, mockContextToXML } from "../../tests/mockContext"
import { createImportLocalRoundTrip } from "./localRoundTrip"
import { createLocalIndexesCollector } from "../projectDefinition/localIndexes"
import { prepareTestXmlAnomalyAssignment } from "../xmlAnomalies/testSupport"
import { buildPreparedAssignmentXml } from "../fullSyncToXml/xmlAnomalyAssignment"

describe("import local round-trip", () => {
  it.each([
    { isFileRoot: false, attributes: 'xmlns="urn:probe" xmlns:custom="urn:custom"', patch: { "_xmlns:custom": "urn:custom", "_xmlns:app": null }, order: undefined },
    { isFileRoot: true, attributes: 'xmlns="urn:probe" xmlns:custom="urn:custom"', patch: { "_xmlns:custom": "urn:custom", "_xmlns:app": null }, order: undefined },
    { isFileRoot: true, attributes: 'xmlns="urn:probe" xmlns:custom="urn:custom"', patch: { "_xmlns:custom": "urn:custom", "_xmlns:app": null }, order: undefined, bareRoot: true },
    { isFileRoot: true, attributes: 'xmlns="urn:probe" xmlns:app="urn:app"', patch: undefined, order: undefined, extraXML: "<Future>keep</Future>" },
    { isFileRoot: false, attributes: 'xmlns="urn:probe" xmlns:app="urn:app"', patch: undefined, order: undefined },
    { isFileRoot: false, attributes: 'xmlns="urn:probe" xmlns:app="urn:original"', patch: { "_xmlns:app": "urn:original" }, order: undefined },
    { isFileRoot: false, attributes: 'xmlns:app="urn:app" xmlns="urn:probe"', patch: undefined, order: { "#order": ["_xmlns:app", "_xmlns"] } },
    { isFileRoot: false, attributes: 'xmlns="urn:probe" xmlns:app="urn:app" version="unknown"', patch: undefined, order: undefined, error: "Не согласована XML-аномалия оболочки" },
  ])("проверяет оболочку без reference: $attributes, fileRoot=$isFileRoot", (scenario) => {
    const { isFileRoot, attributes, patch, order } = scenario
    const bareRoot = "bareRoot" in scenario
    const preparation = { attributes: (own: Readonly<Record<string, unknown>>) => ({ _xmlns: "urn:probe", "_xmlns:app": "urn:app", ...own }) }
    const { context, execution, annotations, roundTrip } = localRoundTripFixture(
      bareRoot ? { prepareRootOutput: () => preparation } : {},
    )
    const rule: MetadataItemRule = { itemType: "NamespaceProbe", properties: {
      ...(bareRoot ? {} : { root: { type: "XMLRoot", container: "Probe", isFileRoot, xmlOnly: true,
        rootAttributes: { _xmlns: "urn:probe", "_xmlns:app": "urn:app" } } }),
      name: { type: "string", xml: "Name", yaml: "Имя" },
    } }
    const rootName = isFileRoot ? "Probe" : "MetaDataObject"
    const body = "<Name>Пример</Name>" + ("extraXML" in scenario ? scenario.extraXML : "")
    const source = parseXmlDocumentWithSaxes(`<${rootName} ${attributes}>${isFileRoot ? body : `<Probe>${body}</Probe>`}</${rootName}>`).roots[0]!
    const importYaml = () => importMetadataItemFromXMLToYAML({ context, rule, xml: source,
      traversal: { execution, annotations, roundTrip, yamlPath: [], rulePath: [], collector: createLocalIndexesCollector() },
    })
    if ("error" in scenario) {
      expect(importYaml).toThrow(scenario.error)
      return
    }
    const yaml = importYaml()
    expect(yaml).toMatchObject({ Имя: "Пример" })
    expect(annotations.at(yaml as object, "@")?.xml).toEqual(patch)
    expect(annotations.at(yaml as object, "@\\#attributes")?.xml).toEqual(order)
    const prepared = prepareTestXmlAnomalyAssignment({
      parsed: parseMetadataYaml(serializeYAMLDocument(yaml, annotations).text), rootRule: rule,
    })
    expect(prepared.rawBoundaries.every(boundary => boundary.documentSelector === "")).toBe(true)
    const exported = convertMetadataItemFromYAMLToXML({
      context: mockContextToXML(), rule, yaml: prepared.preparedYamlFile.data,
      outputs: [{ key: "out", ...(bareRoot ? { itemPreparation: preparation } : {}) }],
      convertProperties: params => convertPropertiesFromYAMLToXML({ ...params, execution }),
    }).outputs.get("out")!
    const restored = buildPreparedAssignmentXml({
      context: mockContextToXML(), document: { targetXmlPath: "Probe.xml", xml: bareRoot ? { Probe: exported } : exported,
        deferred: [], rootRule: rule, rawBoundaries: prepared.rawBoundaries },
    })
    expect(restored.trim()).toBe(xmlExport([source]).trim())
  })

  it("восстанавливает атрибут из ключа коллекции без дополнительного raw", () => {
    const { context, execution, annotations, roundTrip } = localRoundTripFixture()
    const rule: MetadataItemRule = { itemType: "KeyedFlagsProbe", properties: {
      flags: { type: "ChartOfAccountsPredefinedAccountingFlags", xml: "Flags", yaml: "Признаки" },
    } }
    const yaml = importPropertiesFromXMLToYAML({
      context, execution, rule, annotations, roundTrip, yamlPath: [], rulePath: [],
      collector: createLocalIndexesCollector(),
      sources: [{ context, xml: parseXmlDocumentWithSaxes('<Root><Flags><Flag ref="Флаг">false</Flag></Flags></Root>').roots[0]! }],
    })
    expect(yaml).toEqual({ Признаки: { Флаг: { Значение: "Ложь" } } })
  })

  it("открывает глубокую цепочку с линейным числом обходов стека", () => {
    const depth = 64
    const roots = nestedElements(depth)
    const execution = createRuleRegistrySet(metadataRules).execution
    const roundTrip = createImportLocalRoundTrip({
      execution,
      context: mockContextToXML(),
      annotations: createXmlAnomalyAnnotations(),
      decisions: [],
    })
    const rule: MetadataItemRule = { itemType: "LinearStackItem", properties: {} }
    const originalIterator = Array.prototype[Symbol.iterator]
    let iteratedValues = 0
    Array.prototype[Symbol.iterator] = (function* countedIterator<T>(this: T[]) {
      for (let index = 0; index < this.length; index++) {
        iteratedValues++
        yield this[index]!
      }
      return undefined
    }) as typeof Array.prototype[typeof Symbol.iterator]
    try {
      for (let index = 0; index < depth; index++) {
        roundTrip.open({
          context: mockContextFromXML(),
          rule,
          yaml: {},
          sources: [{ context: mockContextFromXML(), xml: roots[index]! }],
          yamlPath: [index],
          rulePath: [],
        })
      }
    } finally {
      Array.prototype[Symbol.iterator] = originalIterator
    }

    expect(iteratedValues).toBeLessThan(depth * 20)
  })
})

function localRoundTripFixture(options: Pick<Parameters<typeof createImportLocalRoundTrip>[0], "prepareRootOutput"> = {}) {
  const context = mockContextFromXML()
  const execution = createRuleRegistrySet(metadataRules).execution
  const annotations = createXmlAnomalyAnnotations()
  const roundTrip = createImportLocalRoundTrip({ execution, context: mockContextToXML(), annotations, decisions: [], ...options })
  return { context, execution, annotations, roundTrip }
}

function nestedElements(depth: number): XmlElementNode[] {
  const document = parseXmlDocumentWithSaxes(`${"<Node>".repeat(depth)}${"</Node>".repeat(depth)}`)
  const result: XmlElementNode[] = []
  let current: XmlElementNode | undefined = document.roots[0]
  while (current !== undefined) {
    result.push(current)
    current = current.content.find((node): node is XmlElementNode => node.type === "element")
  }
  return result
}
