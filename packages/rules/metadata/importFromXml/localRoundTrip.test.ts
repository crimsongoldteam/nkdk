import { ExecutionPath, createXmlImportAttemptJournal } from "@nkdk/runtime/rule-kit"
import { createFinalBoundaryReferences } from "./finalBoundaryReferences"
import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
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
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { configurationExtensionPropertyStatesAugmenter } from "../appliedObjects/configurationExtension/propertyStates"
import { createMetadataExecutionRegistrySets, withMetadataExecutionRegistrySets } from "../composition/metadataExecutionContext"

describe("import local round-trip", () => {
  it.each([
    { type: "FormAttributes", itemType: "FormAttribute", tag: "Attribute", xml: "Items", attribute: "name" },
    { type: "FormCommands", itemType: "FormCommand", tag: "Command", xml: "Items", attribute: "name" },
    { type: "FormAttributes", itemType: "FormAttributeColumn", tag: "Column", xml: "Items", attribute: "name" },
    { type: "FormAttributes", itemType: "FormAttributeColumn", tag: "AdditionalColumns", xml: "Items", attribute: "table" },
  ])("сохраняет окончательные факты обоих повторов $type", ({ type, itemType, tag, xml, attribute }) => {
    const collector = createFinalBoundaryReferences(), seen: string[] = []
    const { context, execution, annotations, roundTrip } = localRoundTripFixture({
      attemptParticipant: collector, placeCollectionItem: (parent, key, _path, _annotations, source) => collector.place(parent, key, source),
      selectDecisions(yaml, rule, path) {
        let logicalTarget: { segment: string; filePath: string } | undefined
        if (rule.itemType === itemType) {
          const segment = `Элемент${seen.length}`
          seen.push(segment)
          logicalTarget = { segment, filePath: "Форма.yaml" }
        }
        collector.accept({ yaml, sourcePath: path, finalPath: path, references: [], logicalTarget })
        return []
      },
    })
    const body = tag === "AdditionalColumns" ? '<Column name="Колонка" id="1"/>' : ""
    const repeated = `<${tag} ${attribute}="Повтор" id="1">${body}</${tag}><${tag} ${attribute}="Повтор" id="2">${body}</${tag}>`
    const content = tag === "Column" || tag === "AdditionalColumns"
      ? `<Attribute name="Таблица" id="1"><Columns>${repeated}</Columns></Attribute>` : repeated
    const yaml = importPropertiesFromXMLToYAML({ context, execution, annotations, roundTrip,
      yamlPath: [], rulePath: [], collector: createLocalIndexesCollector(),
      rule: { itemType: "DuplicateSpecializedProbe", properties: { items: { type, xml, yaml: "Элементы", ...(xml === "Items" ? {} : { container: "Items" }) } } },
      sources: [{ context, xml: parseXmlDocumentWithSaxes(`<Root><Items>${content}</Items></Root>`).roots[0]! }],
    })
    expect(seen).toHaveLength(2)
    expect(yaml).toBeDefined()
    expect(collector.finish(yaml!, annotations).logicalAddresses.map(item => item.logicalAddress)).toEqual(seen)
  })
  it("сохраняет неверное состояние расширения через raw и обрабатывает соседа", () => {
    const registries = createMetadataExecutionRegistrySets(metadataRules)
    registries.rules.property.registerMetadataItemXmlImportAugmenter("rollbackProbe", configurationExtensionPropertyStatesAugmenter)
    withMetadataExecutionRegistrySets(registries, () => {
      const context = mockContextFromXML()
      Object.assign(context.fromXML, { currentXMLDefaultVariant: "adopted", metadataItemAugmenter: "rollbackProbe" })
      const annotations = createXmlAnomalyAnnotations(), execution = registries.rules.execution
      const xml = parseXmlDocumentWithSaxes("<Root><Content><ExchangePlanContent><ExtensionProperty><Item><Metadata>Catalog.X</Metadata><State>Wrong</State></Item></ExtensionProperty></ExchangePlanContent></Content><Name>Сосед</Name></Root>").roots[0]!
      const roundTrip = createImportLocalRoundTrip({ execution, context: mockContextToXML(), annotations, decisions: [] })
      const yaml = importPropertiesFromXMLToYAML({ context, execution, annotations, roundTrip,
        audit: createXmlImportAuditSession([xml]), yamlPath: [], rulePath: [], collector: createLocalIndexesCollector(),
        rule: { itemType: "RollbackAugmenterProbe", properties: {
          content: { type: "ExchangePlanContent", xml: "Content", yaml: "Состав" },
          name: { type: "string", xml: "Name", yaml: "Имя" },
        } }, sources: [{ context, xml }],
      })
      expect(yaml).toHaveProperty("Имя", "Сосед")
      expect(serializeYAMLDocument(yaml, annotations).text).toContain("Wrong")
      expect(serializeYAMLDocument(yaml, annotations).text).toContain("!xml/raw")
    })
  })
  it("откатывает незакрытую дочернюю границу и продолжает соседнюю", () => {
    const { context, roundTrip } = localRoundTripFixture()
    const rule: MetadataItemRule = { itemType: "RollbackProbe", properties: {} }
    const roots = parseXmlDocumentWithSaxes("<Root><Failed><Closed/></Failed><Next/></Root>").roots
    const root = roots[0]!
    const failed = root.content.find((node): node is XmlElementNode => node.type === "element" && node.name === "Failed")!
    const closed = failed.content.find((node): node is XmlElementNode => node.type === "element")!
    const next = root.content.find((node): node is XmlElementNode => node.type === "element" && node.name === "Next")!
    const open = (xml: XmlElementNode, path: string[]) => roundTrip.open({ context, rule, yaml: {},
      sources: [{ context, xml }], yamlPath: path, rulePath: [],
    })
    const parent = open(root, [])
    const attempt = createXmlImportAttemptJournal([roundTrip.attemptParticipant]).begin()
    open(failed, ["Failed"])
    open(closed, ["Failed", "Closed"]).finish()
    attempt.rollback()
    expect(() => { open(next, ["Next"]).finish(); parent.finish() }).not.toThrow()
  })
  it("не публикует факты и аннотации созданного объекта отменённой попытки", () => {
    const collector = createFinalBoundaryReferences()
    const { context, annotations, roundTrip } = localRoundTripFixture({
      attemptParticipant: collector,
      selectDecisions(yaml, _rule, path) {
        collector.accept({ yaml, sourcePath: path, finalPath: path, references: [],
          logicalTarget: { segment: "Отменённый", filePath: "Состав.yaml" } })
        return [{ kind: "invalid", target: { kind: "path", path: ["Значение"] }, issueCodes: ["schema.type"] }]
      },
    })
    const attempt = createXmlImportAttemptJournal([roundTrip.attemptParticipant]).begin()
    const discarded = { Значение: "Текст" }
    roundTrip.finalizeCreatedItem!({ yaml: discarded, context, yamlPath: ["Состав", 0],
      rule: { itemType: "Created", properties: {} },
    })
    expect(annotations.at(discarded, "Значение")?.kind).toBe("invalid")
    attempt.rollback()
    const root = { Состав: [{ Значение: "Текст" }] }
    expect(collector.finish(root, annotations).logicalAddresses).toEqual([])
    expect(serializeYAMLDocument(root, annotations).text).not.toContain("!xml/invalid")
  })
  it("не подменяет аномалию созданного объекта аннотацией корня документа", () => {
    const { context, annotations, roundTrip } = localRoundTripFixture({
      selectDecisions: () => [{ kind: "invalid", target: { kind: "path", path: [] }, issueCodes: ["schema.type"] }],
    })
    expect(() => roundTrip.finalizeCreatedItem!({ yaml: {}, context, yamlPath: ["Состав", 0],
      rule: { itemType: "Created", properties: {} },
    })).toThrow("требует адреса в родительской коллекции")
    expect(annotations.root()).toBeUndefined()
  })
  it("проверяет созданный смысловой объект без отдельного повторного XML-proof", () => {
    const seen: unknown[] = []
    const { context, annotations, roundTrip } = localRoundTripFixture({
      selectDecisions(yaml, _rule, path, root) {
        seen.push({ yaml, path, root })
        return [{ kind: "invalid", target: { kind: "path", path: ["Значение"] }, issueCodes: ["rules.unknown-property"] }]
      },
    })
    const yaml = { Значение: "Текст" }
    roundTrip.finalizeCreatedItem!({ yaml, context, yamlPath: ["Состав", 2],
      rule: { itemType: "Created", properties: {} },
    })
    expect(seen).toEqual([{ yaml, path: ["Состав", 2], root: false }])
    expect(annotations.at(yaml, "Значение")?.kind).toBe("invalid")
    expect(yaml).toEqual({ Значение: "Текст" })
  })
  it("сохраняет числовой адрес элемента массива даже при наличии имени", () => {
    const observed: (string | number)[][] = []
    const { context, execution, annotations, roundTrip } = localRoundTripFixture({
      selectDecisions(_yaml, _rule, path, _root, _marks, _name, _context, namedPath) {
        if (path.length === 2) observed.push([...namedPath!()])
        return []
      },
    })
    importPropertiesFromXMLToYAML({
      context, execution, annotations, roundTrip, yamlPath: [], rulePath: [],
      collector: createLocalIndexesCollector(),
      rule: { itemType: "ArrayAddressProbe", properties: {
        indices: { type: "AdditionalIndexCollection", xml: "AdditionalIndex", yaml: "Индексы" },
      } },
      sources: [{ context, xml: parseXmlDocumentWithSaxes(
        "<Root><AdditionalIndex><Name>ИменованныйИндекс</Name></AdditionalIndex></Root>",
      ).roots[0]! }],
    })
    expect(observed).toEqual([["Индексы", 0]])
  })
  it("предоставляет именованный путь до закрытия нескольких вложенных коллекций", () => {
    const observed: (string | number)[][] = []
    const { context, execution, annotations, roundTrip } = localRoundTripFixture({
      selectDecisions(_yaml, _rule, path, _root, _marks, _name, _context, namedPath) {
        if (path.length === 4) observed.push([...namedPath!()])
        return []
      },
    })
    const xml = parseXmlDocumentWithSaxes(`<Root><ChildObjects>
      <TabularSection><Properties><Name>Строки</Name></Properties><ChildObjects>
        <Attribute><Properties><Name>Значение</Name></Properties></Attribute>
      </ChildObjects></TabularSection></ChildObjects></Root>`).roots[0]!
    importCatalogSections(xml, { context, execution, annotations, roundTrip })
    expect(observed).toEqual([["ТабличныеЧасти", "Строки", "Реквизиты", "Значение"]])
  })
  it("назначает аномалию членству в коллекции до закрытия владельца", () => {
    const sequence: string[] = []
    const { context, execution, annotations, roundTrip } = localRoundTripFixture({
      placeCollectionItem(parent, key, path, marks) {
        if (path[0] !== "ТабличныеЧасти") return
        sequence.push("collection")
        marks.set(parent, key, { kind: "invalid", occurrence: 1, target: "value" })
      },
      selectDecisions(yaml, _rule, _path, root, marks) {
        if (root) {
          expect(sequence).toEqual(["collection"])
          expect(marks.at(yaml.ТабличныеЧасти as object, "ОбщееИмя")?.kind).toBe("invalid")
          expect(marks.root()).toBeUndefined()
          sequence.push("root")
        }
        return []
      },
    })
    const xml = parseXmlDocumentWithSaxes(`<Root>
      <ChildObjects><TabularSection><Properties><Name>ОбщееИмя</Name></Properties></TabularSection></ChildObjects>
      </Root>`).roots[0]!
    importCatalogSections(xml, { context, execution, annotations, roundTrip })
    expect(sequence).toEqual(["collection", "root"])
    expect(annotations.root()).toBeUndefined()
  })
  it("не запрашивает отсутствующие зависимости при импорте и proof пустого объекта", () => {
    const { context, execution, annotations, roundTrip } = localRoundTripFixture()
    const rule: MetadataItemRule = { itemType: "SparseProbe", properties: Object.fromEntries(
      Array.from({ length: 512 }, (_, index) => [`value${index}`, { type: "number", yaml: `Поле${index}` }]),
    ) }
    execution.propertyPlan(rule)
    let reads = 0
    const yaml = importPropertiesFromXMLToYAML({
      context, execution, rule, annotations, roundTrip, yamlPath: [], rulePath: [],
      collector: createLocalIndexesCollector(),
      dependencies: {
        shouldOmit: () => false,
        propertyKeys: () => [],
        proofPropertyKeys: () => [],
        propertyValue: () => { reads++; return { value: undefined } },
      },
      sources: [{ context, xml: parseXmlDocumentWithSaxes("<Root/>").roots[0]! }],
    })
    expect(yaml).toEqual({})
    expect(reads).toBeLessThan(10)
  })

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
      traversal: { execution, annotations, roundTrip, pathCursor: ExecutionPath.from<string | number>([]), rulePath: [], collector: createLocalIndexesCollector() },
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

function importCatalogSections(xml: XmlElementNode, fixture: ReturnType<typeof localRoundTripFixture>) {
  const { context, execution, annotations, roundTrip } = fixture
  return importMetadataItemFromXMLToYAML({
    context, rule: { itemType: "CatalogSectionsProbe", properties: {
      tabularSections: MetadataCatalogRules.properties.tabularSections,
    } }, xml,
    traversal: { execution, annotations, roundTrip, pathCursor: ExecutionPath.from<string | number>([]),
      rulePath: [], collector: createLocalIndexesCollector() },
  })
}

function localRoundTripFixture(options: Pick<Parameters<typeof createImportLocalRoundTrip>[0], "prepareRootOutput" | "placeCollectionItem" | "selectDecisions" | "attemptParticipant"> = {}) {
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
