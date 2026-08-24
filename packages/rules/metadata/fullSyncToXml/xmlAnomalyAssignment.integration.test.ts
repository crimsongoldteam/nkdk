import {
  parseMetadataYaml,
  parseXmlDocumentWithSaxes,
  xmlAnnotatedMappingEntries,
  type XmlAnomalyRuntime,
} from "@nkdk/runtime"
import {
  composeMetadataRules,
  createRuleRegistrySet,
  defineMetadataRules,
  definePropertyTypeRule,
  emptyMetadataRules,
  propertyTypesFromContributions,
  withPropertyRuleRegistrySet,
  withRuleRegistrySet,
  convertMetadataItemFromYAMLToXML,
  convertPropertiesFromYAMLToXML,
  type MetadataItemRule,
  type YAMLToXMLNestedRule,
} from "@nkdk/runtime/rule-kit"
import { describe, expect, it, vi } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { metadataRules } from "../composition/metadataRules"
import "../../tests/metadataExecutionContext"
import {
  buildPreparedAssignmentXml,
  prepareXmlAnomalyAssignment,
} from "./xmlAnomalyAssignment"

const rule = {
  itemType: "SyntheticOwner",
  properties: {
    invalid: { type: "string", yaml: "Неверное", xml: "Invalid" },
    important: { type: "string", yaml: "Важное", xml: "Important" },
    expanded: { type: "string", yaml: "Развернутое", xml: "Expanded" },
    missing: { type: "string", yaml: "Отсутствует", xml: "Missing", defaultValueXML: "default" },
    compact: { type: "string", yaml: "Компактное", xml: "Compact" },
  },
} as const satisfies MetadataItemRule

const collectionItemRule = {
  itemType: "SyntheticCollectionItem",
  properties: {
    name: { type: "string", xml: "Name" },
    value: { type: "string", yaml: "Значение", xml: "Value" },
  },
} as const satisfies MetadataItemRule

type CollectionNestedRule = Extract<YAMLToXMLNestedRule, { readonly kind: "collection" }>
const resolveCollectionItemRule = vi.fn(
  (_params: Parameters<NonNullable<CollectionNestedRule["resolveItemRule"]>>[0]) => collectionItemRule,
)
const collectionDescriptor = {
  kind: "collection",
  itemRule: collectionItemRule,
  yamlShape: "record",
  xmlElement: "Item",
  keyField: "name",
  resolveItemRule: resolveCollectionItemRule,
} as const satisfies YAMLToXMLNestedRule

const collectionOwnerRule = {
  itemType: "SyntheticCollectionOwner",
  properties: {
    items: {
      type: "SyntheticNamedCollection",
      yaml: "Реквизиты",
      xml: "Items",
    },
  },
} as const satisfies MetadataItemRule

const singletonOwnerRule = {
  itemType: "SyntheticSingletonOwner",
  properties: {
    extendedTooltip: {
      type: "ExtendedTooltip",
      yaml: "РасширеннаяПодсказка",
      xml: "ExtendedTooltip",
    },
  },
} as const satisfies MetadataItemRule

const anomalyRegistries = createRuleRegistrySet(composeMetadataRules(
  metadataRules,
  defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: propertyTypesFromContributions([
      definePropertyTypeRule(
        "SyntheticNamedCollection" as never,
        "yamlToXMLNestedRule",
        collectionDescriptor,
      ),
    ]),
    xmlAnomalies: [{
      kind: "hiddenSingletonName",
      boundary: { itemType: "SyntheticSingletonOwner", propertyKey: "extendedTooltip" },
    }],
  }),
))

describe("единое восстановление XML-аномалий assignment", () => {
  it("передаёт invalid/important обычному экспорту и извлекает raw до fromYAML", () => {
    const yaml = [
      "Неверное: !xml/invalid bad",
      "Важное: !xml/important keep",
      'Развернутое: !xml/raw "01"',
      "Отсутствует: !xml/raw null",
      "Компактное: !xml/raw",
      'Properties\\Future: !xml/raw "future"',
    ].join("\n")
    const generateCompactRaw = vi.fn(() =>
      parseXmlDocumentWithSaxes('<Compact generated="yes"/>').roots
    )
    const runtime = anomalyRuntime({ generateCompactRaw })

    const prepared = prepareAnomalies(yaml, runtime)

    expect(prepared.itemName).toBe("Один")
    expect(prepared.preparedYamlFile.data).toEqual({
      Неверное: "bad",
      Важное: "keep",
    })
    expect(prepared.rawBoundaries.map(({ path }) => path)).toEqual([
      "Expanded",
      "Missing",
      "Compact",
      "Properties\\Future",
    ])
    expect(generateCompactRaw).toHaveBeenCalledOnce()
  })

  it("объединяет expanded/compact raw после deferred и подавляет default через raw null", () => {
    const yaml = [
      'Развернутое: !xml/raw "01"',
      "Отсутствует: !xml/raw null",
      "Компактное: !xml/raw",
      'Properties\\Future: !xml/raw "future"',
    ].join("\n")
    const prepared = prepareAnomalies(yaml, anomalyRuntime({
      generateCompactRaw: () => parseXmlDocumentWithSaxes("<Compact><Generated>true</Generated></Compact>").roots,
    }))

    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Objects/One.xml",
        xml: {
          Root: {
            Expanded: "ordinary",
            Missing: "default",
            Deferred: "before",
          },
        },
        deferred: [],
        rootRule: rule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })
    const root = parseXmlDocumentWithSaxes(xml).compatibility.Root as Record<string, unknown>

    expect(root).toMatchObject({
      Expanded: "01",
      Compact: { Generated: "true" },
      Properties: { Future: "future" },
    })
    expect(root).not.toHaveProperty("Missing")
  })

  it("не изменяет исходный XML-документ при чистой сборке", () => {
    const xml = { Root: { Value: "before" } }

    buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml,
        deferred: [],
        rootRule: rule,
        rawBoundaries: [],
      },
      context: mockContextToXML(),
    })

    expect(xml).toEqual({ Root: { Value: "before" } })
  })

  it("исключает скрытое Имя реального вложенного singleton из semantic YAML и меняет его XML-атрибут", () => {
    const prepared = prepareAnomalies([
      "РасширеннаяПодсказка:",
      "  Имя: !xml/raw СтароеИмяExtendedTooltip",
      "  Заголовок:",
      "    Текст: Подсказка",
    ].join("\n"), anomalyRegistries.xmlAnomalies, singletonOwnerRule, anomalyRegistries)

    expect(prepared.itemName).toBe("Один")
    expect(prepared.preparedYamlFile.data).toEqual({
      РасширеннаяПодсказка: { Заголовок: { Текст: "Подсказка" } },
    })
    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: {
          Root: {
            ExtendedTooltip: {
              _name: "КаноническоеИмяРасширеннаяПодсказка",
              Title: "Подсказка",
            },
          },
        },
        deferred: [],
        rootRule: singletonOwnerRule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })

    expect(xml).toContain('<ExtendedTooltip name="СтароеИмяExtendedTooltip">')
    expect(xml).toContain("<Title>Подсказка</Title>")
  })

  it("отклоняет скрытое внешнее имя singleton нестрокового вида", () => {
    expect(() => prepareAnomalies(
      "РасширеннаяПодсказка:\n  Имя: !xml/raw {}\n",
      anomalyRegistries.xmlAnomalies,
      singletonOwnerRule,
      anomalyRegistries,
    )).toThrow("должно быть непустой допустимой XML-строкой")
  })

  it("адресует raw item и его поля по физическим вхождениям named collection", () => {
    resolveCollectionItemRule.mockClear()
    const prepared = prepareAnomalies([
      "Реквизиты:",
      "  Код:",
      '    Значение: !xml/raw "01"',
      "  !xml/invalid Код: !xml/raw",
      "    Name: Код",
      '    Value: "02"',
      "  !xml/invalid/2 Код:",
      '    Значение: !xml/raw "03"',
    ].join("\n"), anomalyRuntime({ generateCompactRaw: () => undefined }), collectionOwnerRule, anomalyRegistries)

    const semanticCollection = (prepared.preparedYamlFile.data as Record<string, unknown>).Реквизиты as Record<string, unknown>
    expect(xmlAnnotatedMappingEntries(semanticCollection, prepared.preparedYamlFile.annotations)).toEqual([
      ["Код", {}],
      ["Код", {}],
      ["Код", {}],
    ])
    const physicalKeys = Object.keys(semanticCollection)
    expect(prepared.preparedYamlFile.annotations.keyAt(semanticCollection, physicalKeys[1]!)).toMatchObject({
      kind: "invalid",
      logicalKey: "Код",
      occurrence: 1,
    })
    expect(prepared.preparedYamlFile.annotations.keyAt(semanticCollection, physicalKeys[2]!)).toMatchObject({
      kind: "invalid",
      logicalKey: "Код",
      occurrence: 2,
    })
    expect(resolveCollectionItemRule.mock.calls.map(([params]) => [params.name, params.index])).toEqual([
      ["Код", 0],
      ["Код", 1],
      ["Код", 2],
    ])

    const ordinary = withPropertyRuleRegistrySet(anomalyRegistries.property, () =>
      withRuleRegistrySet(anomalyRegistries, () => convertMetadataItemFromYAMLToXML({
        convertProperties: convertPropertiesFromYAMLToXML,
        context: mockContextToXML(),
        yaml: prepared.preparedYamlFile.data,
        annotations: prepared.preparedYamlFile.annotations,
        rule: collectionOwnerRule,
        outputs: [{ key: "owner" }],
      }).outputs.get("owner")),
    )
    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: ordinary },
        deferred: [],
        rootRule: collectionOwnerRule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })
    const root = parseXmlDocumentWithSaxes(xml).compatibility.Root as Record<string, unknown>
    const items = (root.Items as Record<string, unknown>).Item as Array<Record<string, unknown>>

    expect(items.map(({ Name, Value }) => ({ Name, Value }))).toEqual([
      { Name: "Код", Value: "01" },
      { Name: "Код", Value: "02" },
      { Name: "Код", Value: "03" },
    ])
  })

  it("объединяет terminal raw attributes/order с обычным выводом", () => {
    const prepared = prepareAnomalies([
      "Properties\\#attributes: !xml/raw",
      '  _future: "x"',
      "  \"#order\": [_known, _future]",
      "Properties\\#order: !xml/raw [Known, Future]",
      'Properties\\Future: !xml/raw "future"',
    ].join("\n"), anomalyRuntime({ generateCompactRaw: () => undefined }))

    expect(prepared.rawBoundaries).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "Properties\\#attributes", suppressOrdinaryOutput: false }),
      expect.objectContaining({ path: "Properties\\#order", suppressOrdinaryOutput: false }),
    ]))
    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: { Properties: { _known: "k", Known: "known" } } },
        deferred: [],
        rootRule: rule,
        rawBoundaries: prepared.rawBoundaries,
      },
      context: mockContextToXML(),
    })

    expect(xml.indexOf('known="k"')).toBeLessThan(xml.indexOf('future="x"'))
    expect(xml.indexOf("<Known>")).toBeLessThan(xml.indexOf("<Future>"))
  })

  it("сохраняет служебный порядок XML-дочерних элементов в чистой сборке", () => {
    const root = { First: "first", Second: "second" }
    Object.defineProperty(root, Symbol.for("xmlOrderedChildren"), {
      enumerable: false,
      value: [
        { key: "Second", value: "second" },
        { key: "First", value: "first" },
      ],
    })

    const xml = buildPreparedAssignmentXml({
      document: {
        targetXmlPath: "Root.xml",
        xml: { Root: root },
        deferred: [],
        rootRule: rule,
        rawBoundaries: [],
      },
      context: mockContextToXML(),
    })

    expect(xml.indexOf("<Second>")).toBeLessThan(xml.indexOf("<First>"))
  })

  it("разрешает invalid-ключу иметь raw-значение", () => {
    const prepared = prepareAnomalies(
      '!xml/invalid Развернутое: !xml/raw "01"\n',
      anomalyRuntime({ generateCompactRaw: () => undefined }),
    )

    expect(prepared.preparedYamlFile.data).toEqual({})
    expect(prepared.rawBoundaries).toEqual([
      expect.objectContaining({ path: "Expanded", value: "01" }),
    ])
  })
})

function anomalyRuntime(overrides: {
  generateCompactRaw: XmlAnomalyRuntime["generateCompactRaw"]
  allowsHiddenSingletonName?: XmlAnomalyRuntime["allowsHiddenSingletonName"]
}): XmlAnomalyRuntime {
  return {
    requiresImportant: () => false,
    allowsHiddenSingletonName: overrides.allowsHiddenSingletonName ?? (() => false),
    generateCompactRaw: overrides.generateCompactRaw,
  }
}

function prepareAnomalies(
  yaml: string,
  runtime: XmlAnomalyRuntime,
  rootRule: MetadataItemRule = rule,
  registries?: ReturnType<typeof createRuleRegistrySet>,
) {
  const parsed = parseMetadataYaml(yaml)
  const prepare = () => prepareXmlAnomalyAssignment({
    preparedYamlFile: {
      projectPath: "Объект/Один/Свойства.yaml",
      filePath: "/project/Объект/Один/Свойства.yaml",
      role: "properties",
      owner: { dir: "Объект", name: "Один" },
      data: parsed.data,
      annotations: parsed.annotations,
      syntaxDiagnostics: [],
    },
    rootRule,
    itemName: "Один",
    runtime,
  })
  return registries === undefined ? prepare() : withRuleRegistrySet(registries, prepare)
}
